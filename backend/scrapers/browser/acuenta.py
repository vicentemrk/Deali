"""
AcuentaScraper — SMU Group
aCuenta requiere Playwright: descubre campañas activas desde /ofertas,
luego scrapea las tarjetas de producto con extracción de precios robusta.
"""
import asyncio
import hashlib
import re
from typing import Optional

import structlog

from config import settings
from scrapers.base import BaseScraper
from scrapers.models import RawOffer
from scrapers.vtex.base_vtex import _map_category, _clean_product_name

log = structlog.get_logger(__name__)

TARGET_PRODUCTS = 75
MAX_CAMPAIGN_PAGES = 3
MAX_DISCOVERED_CAMPAIGNS = 10

BASE_URL = "https://www.acuenta.cl"
OFFERS_URL = f"{BASE_URL}/ofertas"

FALLBACK_CAMPAIGN_URLS = [
    f"{BASE_URL}/ca/luka-dos-y-tres-lukas/60",
    f"{BASE_URL}/ca/canasta-ahorradora/400",
    f"{BASE_URL}/ca/ofertas-semanales/200",
]

CARD_FIELD_TIMEOUT = 1_200  # ms

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _parse_money(text: Optional[str]) -> float:
    """Extrae primer valor numérico de un string de precio en CLP."""
    if not text:
        return 0.0
    cleaned = re.sub(r"[^0-9]", "", text)
    return float(cleaned) if cleaned else 0.0


def _parse_all_prices(text: Optional[str]) -> list[float]:
    """Extrae todos los valores monetarios de un texto."""
    if not text:
        return []
    matches = re.findall(r"\$\s*([\d\.]+)", text)
    result = []
    for m in matches:
        v = _parse_money(m)
        if v > 0:
            result.append(v)
    return result


def _parse_category_from_url(url: str) -> Optional[str]:
    match = re.search(r"/ca/([^/?#]+)", url)
    raw = match.group(1) if match else None
    return _map_category(raw)


async def _safe_text(locator, timeout: int = CARD_FIELD_TIMEOUT) -> Optional[str]:
    try:
        return await locator.text_content(timeout=timeout)
    except Exception:
        return None


async def _safe_attr(locator, attr: str, timeout: int = CARD_FIELD_TIMEOUT) -> Optional[str]:
    try:
        return await locator.get_attribute(attr, timeout=timeout)
    except Exception:
        return None


class AcuentaScraper(BaseScraper):
    @property
    def store_slug(self) -> str:
        return "acuenta"

    @property
    def scraper_type(self) -> str:
        return "browser"

    async def scrape(self) -> list[RawOffer]:
        self._log_start()

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=True)
                ctx = await browser.new_context(
                    user_agent=_USER_AGENT,
                    viewport={"width": 1440, "height": 900},
                    extra_http_headers={"Accept-Language": "es-CL,es;q=0.9"},
                )
                page = await ctx.new_page()

                try:
                    offers = await self._run(page)
                finally:
                    await page.close()
                    await ctx.close()
                    await browser.close()

            self._log_result(len(offers))
            return offers

        except Exception as exc:
            log.error("acuenta.fatal", error=str(exc))
            return []

    async def _run(self, page) -> list[RawOffer]:
        offers: list[RawOffer] = []
        seen: set[str] = set()

        campaign_urls = await self._discover_campaigns(page)

        for campaign_url in campaign_urls:
            if len(offers) >= TARGET_PRODUCTS:
                break

            category_hint = _parse_category_from_url(campaign_url)

            for page_num in range(1, MAX_CAMPAIGN_PAGES + 1):
                if len(offers) >= TARGET_PRODUCTS:
                    break

                page_url = self._build_page_url(campaign_url, page_num)
                log.info("acuenta.fetching", url=page_url)

                try:
                    await page.goto(page_url, wait_until="domcontentloaded", timeout=20_000)
                except Exception as exc:
                    log.warning("acuenta.goto_error", url=page_url, error=str(exc))
                    break

                await page.wait_for_timeout(1_500)

                # Verifica si hay productos en la página
                has_products = await page.locator(
                    '[class*="StyledCard"], a.containerCard, [data-testid="card-name"], a[href*="/p/"]'
                ).count() > 0

                if not has_products:
                    log.info("acuenta.empty_page", url=page_url)
                    break

                cards = await self._extract_cards(page)
                if not cards:
                    break

                log.info("acuenta.page_ok", url=page_url, cards=len(cards))

                added = 0
                for card in cards:
                    name_key = card["name"].lower()
                    if name_key in seen:
                        continue
                    if not card["original_price"] or card["offer_price"] >= card["original_price"]:
                        continue

                    discount_pct = (1 - card["offer_price"] / card["original_price"]) * 100
                    if discount_pct < 5.0:
                        continue

                    seen.add(name_key)
                    sku = hashlib.sha256(f"acuenta::{name_key}".encode()).hexdigest()[:32]
                    offer_url = card["offer_url"]
                    if not offer_url.startswith("http"):
                        offer_url = f"{BASE_URL}{offer_url}"

                    offers.append(RawOffer(
                        sku=sku,
                        product_name=card["name"],
                        brand=None,
                        image_url=card["image_url"],
                        offer_url=offer_url,
                        offer_price=card["offer_price"],
                        original_price=card["original_price"],
                        store_slug="acuenta",
                        category_hint=category_hint,
                    ))
                    added += 1
                    if len(offers) >= TARGET_PRODUCTS:
                        break

                if added == 0:
                    break  # Página sin nuevos productos → siguiente campaña

        return offers

    def _build_page_url(self, url: str, page_num: int) -> str:
        if page_num <= 1:
            return url
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}currentPage={page_num}"

    async def _discover_campaigns(self, page) -> list[str]:
        """Descubre URLs de campañas activas desde /ofertas."""
        try:
            await page.goto(OFFERS_URL, wait_until="domcontentloaded", timeout=25_000)
            await page.locator('a[href*="/ca/"]').first.wait_for(timeout=10_000)

            discovered = await page.eval_on_selector_all(
                'a[href*="/ca/"]',
                """elements => {
                    const urls = new Set();
                    for (const el of elements) {
                        const href = el.href || '';
                        if (!href.includes('/ca/')) continue;
                        if (href.includes('?')) continue;
                        urls.add(href.replace(/\\/$/, ''));
                    }
                    return Array.from(urls);
                }"""
            )

            if not discovered:
                log.warning("acuenta.discovery_empty")
                return FALLBACK_CAMPAIGN_URLS

            result = discovered[:MAX_DISCOVERED_CAMPAIGNS]
            log.info("acuenta.campaigns_found", count=len(result))
            return result

        except Exception as exc:
            log.warning("acuenta.discovery_error", error=str(exc))
            return FALLBACK_CAMPAIGN_URLS

    async def _extract_cards(self, page) -> list[dict]:
        """Extrae tarjetas de producto de la página actual con parsing de precios robusto."""
        cards_out: list[dict] = []

        card_locator = page.locator(
            '[class*="StyledCard"], [data-testid="product-card"], '
            'article[class*="product"], li[class*="product"], a.containerCard'
        )
        count = await card_locator.count()

        for i in range(count):
            card = card_locator.nth(i)

            # URL del producto
            anchor = card.locator('a[href*="/p/"], a[href*="/producto/"], a[href*="/articulo/"]').first
            href = await _safe_attr(anchor, "href")
            if not href:
                continue

            # Nombre
            raw_name = await _safe_text(card.locator('[data-testid="card-name"]').first)
            fallback_name = await _safe_text(anchor)
            name = _clean_product_name((raw_name or fallback_name) or "")[:180]
            if not name:
                continue

            # Imagen
            img = card.locator("img").first
            srcset = await _safe_attr(img, "srcset")
            data_src = await _safe_attr(img, "data-src")
            src = await _safe_attr(img, "src")
            if srcset:
                parts = [p.strip() for p in srcset.split(",")]
                image_url = parts[-1].split()[0] if parts else ""
            else:
                image_url = data_src or src or ""

            # Precios
            base_price_text = await _safe_text(card.locator('[data-testid="card-base-price"]').first)
            crossed_text = await _safe_text(card.locator('[data-testid^="crossed-out-price"], s, del').first)
            full_text = await card.inner_text()

            offer_price = _parse_money(base_price_text)
            original_price = 0.0
            crossed_values = _parse_all_prices(crossed_text)

            if crossed_values:
                greater = [v for v in crossed_values if v > offer_price]
                original_price = min(greater) if greater else max(crossed_values)

            # Fallback: extraer todos los precios del texto completo
            if not offer_price or not original_price:
                all_prices = _parse_all_prices(full_text)
                numeric = [v for v in all_prices if v > 0]
                if not offer_price and numeric:
                    offer_price = numeric[0]
                if not original_price and len(numeric) >= 2:
                    greater = [v for v in numeric if v > offer_price]
                    if greater:
                        original_price = min(greater)

            cards_out.append({
                "name": name,
                "image_url": image_url,
                "offer_url": href,
                "offer_price": offer_price,
                "original_price": original_price,
            })

        return [c for c in cards_out if c["name"] and c["offer_url"] and c["offer_price"] > 0]
