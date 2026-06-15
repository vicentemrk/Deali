"""
TottusScraper — Falabella Chile
Estrategia en cascada (misma que la versión TS, portada a Python):
  1. __NEXT_DATA__ paginado (no requiere browser ni cookies)
  2. Recommended-products API de Falabella (con cookie de sesión)
  3. Playwright como último fallback si los anteriores fallan

La estrategia httpx-first evita levantar browser innecesariamente.
"""
import asyncio
import hashlib
import json
import re
from typing import Optional

import httpx
import structlog

from config import settings
from scrapers.base import BaseScraper
from scrapers.models import RawOffer
from scrapers.vtex.base_vtex import _map_category

log = structlog.get_logger(__name__)

TARGET_PRODUCTS = 100
NEXT_DATA_MAX_PAGES = 7
OFFERS_URL = "https://www.tottus.cl/tottus-cl/ofertas"

TOTTUS_WIDGET_IDS = [
    "a9ac056e-1873-41c6-a7dc-c21087548c41",
    "f7bc8088-4853-4d16-bc6e-d1bf385a05f6",
    "34f3f74d-94ba-4a9b-8b9c-fd6d89cf7ebf",
    "ecf69f65-32cb-4856-8fbc-4aef0ec572df",
]

TOTTUS_ZONES = ",".join([
    "PCL1223", "PCL2976", "PCL3651", "PCL3887", "PCL2709", "PCL2829",
    "PCL3505", "PCL3136", "PCL4992", "PCL5127", "PCL1486", "PCL3031",
    "PCL1839", "PCL3676", "PCL3139", "PCL2992", "PCL2269", "PCL4976",
    "PCL651", "LEG_TOTTUS_DOMINICOS_1", "PCL596", "PCL226", "PCL108",
    "PCL2288", "PCL3232", "PCL3145", "PCL1394", "PCL5090", "PCL5234", "PCL2792",
])

_NEXT_DATA_RE = re.compile(
    r'<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)</script>', re.IGNORECASE
)

_BASE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-CL,es;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _safe_price(value: object) -> float:
    """Convierte valor de precio a float de forma segura."""
    if isinstance(value, (int, float)):
        v = float(value)
        return v if v > 0 else 0.0
    if isinstance(value, str):
        cleaned = re.sub(r"[^0-9]", "", value)
        return float(cleaned) if cleaned else 0.0
    return 0.0


def _extract_products_from_next_data(data: dict) -> list[dict]:
    """Intenta múltiples rutas en __NEXT_DATA__ donde Tottus embebe sus productos."""
    props = data.get("props", {}).get("pageProps", {})
    candidates = [
        props.get("initialData", {}).get("products"),
        props.get("categoryData", {}).get("products"),
        props.get("searchData", {}).get("results"),
        props.get("data", {}).get("products"),
        props.get("products"),
        props.get("offerData", {}).get("products"),
    ]
    for c in candidates:
        if isinstance(c, list) and c:
            return c
    return []


def _parse_next_data_product(product: dict, seen: set[str]) -> Optional[RawOffer]:
    name = (product.get("displayName") or "").strip()
    if not name or name.lower() in seen:
        return None

    variant = (product.get("variants") or [{}])[0]
    prices = variant.get("price", {})
    offer_price = _safe_price(prices.get("specialPrice"))
    original_price = _safe_price(prices.get("originalPrice"))

    if not offer_price or not original_price or offer_price >= original_price:
        return None

    images = variant.get("medias") or []
    image_url = images[0].get("url", "") if images else ""

    slug = (product.get("slug") or variant.get("id") or "").strip()
    offer_url = (
        f"https://www.tottus.cl/tottus-cl/articulo/{slug}"
        if slug
        else OFFERS_URL
    )

    brand = product.get("brand")
    if isinstance(brand, dict):
        brand = brand.get("name")

    categories = product.get("categoriesHierarchy") or []
    category_raw = categories[0].split(">")[0].strip() if categories else ""
    category_hint = _map_category(category_raw)

    # SKU: preferir id nativo del variant
    sku = variant.get("id") or hashlib.sha256(
        f"tottus::{name.lower()}".encode()
    ).hexdigest()[:32]

    seen.add(name.lower())
    return RawOffer(
        sku=str(sku),
        product_name=name,
        brand=brand or None,
        image_url=image_url,
        offer_url=offer_url,
        offer_price=offer_price,
        original_price=original_price,
        store_slug="tottus",
        category_hint=category_hint,
    )


class TottusScraper(BaseScraper):
    @property
    def store_slug(self) -> str:
        return "tottus"

    @property
    def scraper_type(self) -> str:
        return "browser"

    async def scrape(self) -> list[RawOffer]:
        self._log_start()
        offers: list[RawOffer] = []
        seen: set[str] = set()

        # ── Estrategia 1: __NEXT_DATA__ (sin cookies, sin browser) ────────────
        offers = await self._fetch_next_data(seen)
        log.info("tottus.next_data", count=len(offers))

        # ── Estrategia 2: Recommended-products API (requiere cookie) ──────────
        if len(offers) < TARGET_PRODUCTS and settings.tottus_cookie:
            recommended = await self._fetch_recommended(seen)
            offers.extend(recommended)
            log.info("tottus.recommended", count=len(recommended), total=len(offers))

        # ── Estrategia 3: Playwright (último recurso) ─────────────────────────
        if len(offers) < TARGET_PRODUCTS:
            log.info("tottus.playwright_fallback", reason="insufficient_offers")
            playwright_offers = await self._fetch_playwright(seen)
            offers.extend(playwright_offers)

        self._log_result(len(offers))
        return offers[:TARGET_PRODUCTS]

    async def _fetch_next_data(self, seen: set[str]) -> list[RawOffer]:
        result: list[RawOffer] = []
        async with httpx.AsyncClient(headers=_BASE_HEADERS, timeout=25.0, follow_redirects=True) as client:
            for page in range(1, NEXT_DATA_MAX_PAGES + 1):
                url = f"{OFFERS_URL}?page={page}&sortBy=discountDesc"
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    match = _NEXT_DATA_RE.search(resp.text)
                    if not match:
                        break
                    data = json.loads(match.group(1))
                    products = _extract_products_from_next_data(data)
                    if not products:
                        break
                    for p in products:
                        offer = _parse_next_data_product(p, seen)
                        if offer:
                            result.append(offer)
                    if len(result) >= TARGET_PRODUCTS:
                        break
                except Exception as exc:
                    log.warning("tottus.next_data_error", page=page, error=str(exc))
                    break
                await asyncio.sleep(0.5)
        return result

    async def _fetch_recommended(self, seen: set[str]) -> list[RawOffer]:
        result: list[RawOffer] = []
        headers = {
            **_BASE_HEADERS,
            "Cookie": settings.tottus_cookie,
            "Referer": "https://www.tottus.cl/tottus-cl/content/ofertas-tottus",
        }
        async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
            for widget_id in TOTTUS_WIDGET_IDS:
                url = (
                    "https://www.falabella.com/s/browse/v2/recommended-products/cl"
                    f"?widgetsUUID={widget_id}&pageType=LANDING&site=to_com"
                    f"&politicalId=9e635d19-b626-4171-8beb-d92e58c2a417"
                    f"&priceGroupId=34&zones={TOTTUS_ZONES}&channel=web"
                )
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    payload = resp.json()
                    products = []
                    for widget in payload.get("widgets", []):
                        products.extend(widget.get("data", []))
                    for p in products:
                        name = (p.get("displayName") or "").strip()
                        if not name or name.lower() in seen:
                            continue
                        prices = p.get("prices", [])
                        offer_price = _safe_price(
                            next((x.get("originalPrice") for x in prices if not x.get("crossed")), None)
                        )
                        original_price = _safe_price(
                            next((x.get("originalPrice") for x in prices if x.get("crossed")), None)
                        )
                        if not offer_price or not original_price or offer_price >= original_price:
                            continue
                        media = p.get("mediaUrls", [])
                        image_url = f"{media[0]}/500x500" if media else ""
                        sku = hashlib.sha256(f"tottus::{name.lower()}".encode()).hexdigest()[:32]
                        seen.add(name.lower())
                        result.append(RawOffer(
                            sku=sku,
                            product_name=name,
                            brand=p.get("brand") or None,
                            image_url=image_url,
                            offer_url=p.get("url") or OFFERS_URL,
                            offer_price=offer_price,
                            original_price=original_price,
                            store_slug="tottus",
                            category_hint=None,
                        ))
                except Exception as exc:
                    log.warning("tottus.recommended_error", widget=widget_id, error=str(exc))
        return result

    async def _fetch_playwright(self, seen: set[str]) -> list[RawOffer]:
        """
        Playwright como último fallback: navega a la página de ofertas
        y extrae productos del DOM. Solo se activa si las estrategias
        HTTP puro no alcanzan el mínimo de productos.
        """
        try:
            from playwright.async_api import async_playwright

            result: list[RawOffer] = []
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=True)
                ctx = await browser.new_context(
                    user_agent=_BASE_HEADERS["User-Agent"],
                    extra_http_headers=(
                        {"Cookie": settings.tottus_cookie}
                        if settings.tottus_cookie
                        else {}
                    ),
                )
                page = await ctx.new_page()
                await page.goto(
                    "https://www.tottus.cl/tottus-cl/ofertas?sortBy=discountDesc",
                    wait_until="domcontentloaded",
                    timeout=30_000,
                )
                # Extrae __NEXT_DATA__ del DOM (ya disponible en el HTML)
                next_data_raw = await page.evaluate(
                    "() => document.getElementById('__NEXT_DATA__')?.textContent || ''"
                )
                await ctx.close()
                await browser.close()

                if next_data_raw:
                    data = json.loads(next_data_raw)
                    products = _extract_products_from_next_data(data)
                    for p in products:
                        offer = _parse_next_data_product(p, seen)
                        if offer:
                            result.append(offer)

            return result
        except Exception as exc:
            log.warning("tottus.playwright_error", error=str(exc))
            return []
