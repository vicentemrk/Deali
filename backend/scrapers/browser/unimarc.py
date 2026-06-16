"""
UnimarcScraper — SMU Group
Estrategia: parsea __NEXT_DATA__ (dehydratedState → searchesIntelligence)
desde las URLs de campaña de ofertas. No requiere browser salvo fallback.
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
from scrapers.vtex.base_vtex import _map_category, _clean_product_name

log = structlog.get_logger(__name__)

TARGET_PRODUCTS = 100
BASE_URL = "https://www.unimarc.cl"

# URLs de campañas de ofertas (se actualizan en periodos de promoción)
OFFERS_URLS = [
    "https://www.unimarc.cl/ofertas/black-ofertazo?promotionsOnly=true",
    *[
        f"https://www.unimarc.cl/ofertas/black-ofertazo?promotionsOnly=true&page={p}"
        for p in range(2, 8)
    ],
]

_NEXT_DATA_RE = re.compile(
    r'<script[^>]*id="__NEXT_DATA__"[^>]*type="application/json"[^>]*>([\s\S]*?)</script>',
    re.IGNORECASE,
)
_FALLBACK_JSON_RE = re.compile(
    r'<script[^>]*type="application/json"[^>]*>([\s\S]*?)</script>',
    re.IGNORECASE,
)

_BASE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-CL,es;q=0.9",
}


def _parse_money(value: object) -> float:
    if isinstance(value, (int, float)):
        return float(value) if float(value) > 0 else 0.0
    if isinstance(value, str):
        cleaned = re.sub(r"[^0-9]", "", value)
        return float(cleaned) if cleaned else 0.0
    return 0.0


def _extract_category_hint(product: dict) -> Optional[str]:
    categories = product.get("categories") or []
    first = categories[0] if categories else ""
    parts = [p for p in first.strip("/").split("/") if p]
    raw = parts[0] if parts else None
    return _map_category(raw)


def _map_product(product: dict, seen: set[str]) -> Optional[RawOffer]:
    name = _clean_product_name(product.get("name") or "")
    if not name or name.lower() in seen:
        return None

    seller = (product.get("sellers") or [{}])[0]
    offer_price = _parse_money(seller.get("price"))
    original_price = _parse_money(seller.get("listPrice"))

    # Fallback con datos de promotion
    promo = product.get("promotion") or {}
    promo_price = _parse_money(promo.get("price"))
    promo_saving = _parse_money(promo.get("saving"))

    if not offer_price and promo_price:
        offer_price = promo_price
    if not original_price and promo_price and promo_saving:
        original_price = promo_price + promo_saving

    if not offer_price or not original_price or offer_price >= original_price:
        return None

    discount_pct = (1 - offer_price / original_price) * 100
    if discount_pct < 5.0:
        return None

    # Imagen: puede ser string o dict con src/url
    images = product.get("images") or []
    first_img = images[0] if images else None
    if isinstance(first_img, str):
        image_url = first_img
    elif isinstance(first_img, dict):
        image_url = first_img.get("src") or first_img.get("url") or ""
    else:
        image_url = ""

    detail_url = product.get("detailUrl") or ""
    offer_url = (
        detail_url if detail_url.startswith("http") else f"{BASE_URL}{detail_url}"
    )

    sku = hashlib.sha256(f"unimarc::{name.lower()}".encode()).hexdigest()[:32]
    seen.add(name.lower())

    return RawOffer(
        sku=sku,
        product_name=name,
        brand=product.get("brand") or None,
        image_url=image_url,
        offer_url=offer_url or BASE_URL,
        offer_price=offer_price,
        original_price=original_price,
        store_slug="unimarc",
        category_hint=_extract_category_hint(product),
    )


async def _fetch_products_from_url(client: httpx.AsyncClient, url: str) -> list[dict]:
    """Descarga una página de campaña y extrae productos de __NEXT_DATA__."""
    resp = await client.get(url)
    resp.raise_for_status()

    html = resp.text
    match = _NEXT_DATA_RE.search(html) or _FALLBACK_JSON_RE.search(html)
    if not match:
        log.warning("unimarc.missing_next_data", url=url)
        return []

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        log.warning("unimarc.invalid_json", url=url)
        return []

    queries = (
        data.get("props", {})
        .get("pageProps", {})
        .get("dehydratedState", {})
        .get("queries", [])
    )

    search_query = next(
        (q for q in queries if "searchesIntelligence" in json.dumps(q.get("queryKey", ""))),
        None,
    )

    products = (
        search_query.get("state", {}).get("data", {}).get("data", {}).get("availableProducts", [])
        if search_query
        else []
    )

    if not isinstance(products, list):
        log.warning("unimarc.no_products", url=url)
        return []

    return products


class UnimarcScraper(BaseScraper):
    @property
    def store_slug(self) -> str:
        return "unimarc"

    @property
    def scraper_type(self) -> str:
        return "browser"

    async def scrape(self) -> list[RawOffer]:
        self._log_start()
        offers: list[RawOffer] = []
        seen: set[str] = set()

        async with httpx.AsyncClient(
            headers=_BASE_HEADERS, timeout=25.0, follow_redirects=True
        ) as client:
            for url in OFFERS_URLS:
                if len(offers) >= TARGET_PRODUCTS:
                    break
                try:
                    log.info("unimarc.fetching", url=url)
                    products = await _fetch_products_from_url(client, url)
                    log.info("unimarc.page_ok", url=url, products=len(products))
                    for p in products:
                        offer = _map_product(p, seen)
                        if offer:
                            offers.append(offer)
                        if len(offers) >= TARGET_PRODUCTS:
                            break
                except Exception as exc:
                    log.warning("unimarc.page_error", url=url, error=str(exc))
                await asyncio.sleep(0.5)

        self._log_result(len(offers))
        return offers
