"""
Entrypoint para scrapers browser — ejecutado por GitHub Actions (scraper-browser.yml).
Corre Tottus, Unimarc y aCuenta secuencialmente (Playwright es pesado: un browser a la vez).
Siempre termina con exit code 0 (CI verde) aunque haya errores parciales.
"""
import asyncio
import sys
import uuid

import structlog

from scrapers.browser.acuenta import AcuentaScraper
from scrapers.browser.tottus import TottusScraper
from scrapers.browser.unimarc import UnimarcScraper
from scrapers.ingest import ingest

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ]
)

log = structlog.get_logger(__name__)

# Secuencial: Playwright consume ~300MB por browser — no conviene paralelizar en CI
SCRAPERS = [
    TottusScraper(),
    UnimarcScraper(),
    AcuentaScraper(),
]


async def run_scraper(scraper, run_id: str) -> dict:
    """Ejecuta un scraper y lo ingesta. Nunca lanza excepciones al caller."""
    try:
        offers = await scraper.scrape()
        stats = await ingest(
            offers,
            scraper_name=f"browser.{scraper.store_slug}",
            run_id=run_id,
        )
        return {"store": scraper.store_slug, "status": "ok", **stats}
    except Exception as exc:
        log.error("run.fatal_error", store=scraper.store_slug, error=str(exc))
        return {"store": scraper.store_slug, "status": "error", "error": str(exc)}


async def main() -> None:
    run_id = str(uuid.uuid4())
    log.info("run.start", run_id=run_id, scrapers=[s.store_slug for s in SCRAPERS])

    results = []
    for scraper in SCRAPERS:
        result = await run_scraper(scraper, run_id)
        results.append(result)
        # Pausa entre browsers para liberar memoria
        await asyncio.sleep(2)

    log.info("run.summary", run_id=run_id, results=results)

    failed = [r for r in results if r["status"] == "error"]
    if failed:
        log.warning("run.partial_failures", count=len(failed))

    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
