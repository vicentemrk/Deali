"""
Entrypoint para scrapers VTEX — ejecutado por GitHub Actions (scraper-vtex.yml).
Corre Jumbo, Líder y Santa Isabel en paralelo con asyncio.gather.
Siempre termina con exit code 0 (CI verde) aunque haya errores parciales.
"""
import asyncio
import sys
import uuid

import structlog

from scrapers.ingest import ingest
from scrapers.vtex.jumbo import JumboScraper
from scrapers.vtex.lider import LiderScraper
from scrapers.vtex.santa_isabel import SantaIsabelScraper
from scrapers.vtex.unimarc import UnimarScraper

# Logging estructurado (legible en GitHub Actions y en Fly.io)
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ]
)

log = structlog.get_logger(__name__)

SCRAPERS = [
    JumboScraper(),
    SantaIsabelScraper(),
    UnimarScraper(),
    # LiderScraper(),  # Líder no usa VTEX — requiere browser scraper
]


async def run_scraper(scraper, run_id: str) -> dict:
    """Ejecuta un scraper y lo ingesta. Nunca lanza excepciones al caller."""
    try:
        offers = await scraper.scrape()
        stats = await ingest(
            offers,
            scraper_name=f"vtex.{scraper.store_slug}",
            run_id=run_id,
        )
        return {"store": scraper.store_slug, "status": "ok", **stats}
    except Exception as exc:
        log.error("run.fatal_error", store=scraper.store_slug, error=str(exc))
        # Error fatal pero NO propagamos: el CI debe quedar verde
        return {"store": scraper.store_slug, "status": "error", "error": str(exc)}


async def main() -> None:
    run_id = str(uuid.uuid4())
    log.info("run.start", run_id=run_id, scrapers=[s.store_slug for s in SCRAPERS])

    # Todos los scrapers VTEX en paralelo (son HTTP puro, sin browser)
    results = await asyncio.gather(
        *[run_scraper(s, run_id) for s in SCRAPERS]
    )

    log.info("run.summary", run_id=run_id, results=results)

    # Resumen de éxito/fallo (para visibilidad en Actions logs)
    failed = [r for r in results if r["status"] == "error"]
    if failed:
        log.warning("run.partial_failures", count=len(failed), stores=[r["store"] for r in failed])

    # Siempre exit 0 — el CI no debe fallar por errores de scraping
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
