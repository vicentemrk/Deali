"""
Scraper VTEX base — lógica compartida para Jumbo, Líder y Santa Isabel.
VTEX expone una API JSON pública en vteximg.com.br que no requiere browser.
"""
import asyncio
from typing import List, Optional
from urllib.parse import quote

import httpx
import structlog

from config import settings
from scrapers.base import BaseScraper
from scrapers.models import RawOffer

log = structlog.get_logger(__name__)

# Mapa de categorías VTEX → slugs de Deali
VTEX_CATEGORY_MAP = {
    "bebidas": "bebidas",
    "lacteos": "lacteos",
    "lacteos y huevos": "lacteos",
    "carnes": "carnes-pescados",
    "pescados": "carnes-pescados",
    "frutas": "frutas-verduras",
    "verduras": "frutas-verduras",
    "congelados": "congelados",
    "limpieza": "limpieza-hogar",
    "electrohogar": "electrohogar",
    "mascotas": "mascotas",
    "despensa": "despensa",
    "licores": "bebidas-alcoholicas",
    "alcoholicas": "bebidas-alcoholicas",
    "vinos": "bebidas-alcoholicas",
    "cervezas": "bebidas-alcoholicas",
}


def _map_category(vtex_category: Optional[str]) -> Optional[str]:
    """Convierte una categoría VTEX a un slug de Deali usando coincidencia parcial."""
    if not vtex_category:
        return None
    lower = vtex_category.lower()
    for keyword, slug in VTEX_CATEGORY_MAP.items():
        if keyword in lower:
            return slug
    return "despensa"  # fallback: despensa si no matchea nada


def _parse_vtex_product(item: dict, store_slug: str) -> Optional[RawOffer]:
    """
    Parsea un ítem de la API VTEX a RawOffer.
    Retorna None si el ítem no tiene los datos mínimos requeridos.
    """
    try:
        product_id = str(item.get("productId", ""))
        name = item.get("productName", "").strip()

        if not product_id or not name:
            return None

        # SKU nativo de VTEX
        skus = item.get("items", [])
        sku = str(skus[0].get("itemId", product_id)) if skus else product_id

        # Imagen
        images = item.get("items", [{}])[0].get("images", [])
        image_url = images[0].get("imageUrl", "") if images else ""

        # URL del producto
        link = item.get("link", "") or item.get("linkText", "")
        if not link.startswith("http"):
            link = f"https://www.{store_slug}.cl/{link}"

        # Precios desde commertialOffer
        sellers = item.get("items", [{}])[0].get("sellers", [{}])
        offer = sellers[0].get("commertialOffer", {}) if sellers else {}
        price = offer.get("Price", 0)
        list_price = offer.get("ListPrice", 0)

        if not price or price <= 0:
            return None

        # Marca
        brand = item.get("brand", None)

        # Categoría
        category_raw = item.get("categories", [""])[0] if item.get("categories") else ""
        # Las categorías VTEX vienen como "/Categoria/Subcategoria/" → tomamos la más específica
        parts = [p for p in category_raw.split("/") if p]
        category_hint = _map_category(parts[-1] if parts else None)

        return RawOffer(
            sku=sku,
            product_name=name,
            brand=brand if brand else None,
            image_url=image_url,
            offer_url=link,
            offer_price=float(price),
            original_price=float(list_price) if list_price > price else None,
            store_slug=store_slug,
            category_hint=category_hint,
        )
    except Exception as exc:
        log.warning("vtex.parse_error", store=store_slug, error=str(exc))
        return None


class VtexBaseScraper(BaseScraper):
    """
    Scraper base para tiendas VTEX.
    Subclasses solo necesitan definir store_slug y vtex_domain.
    """

    @property
    def scraper_type(self) -> str:
        return "vtex"

    @property
    def vtex_domain(self) -> str:
        """
        Dominio VTEX para el CDN de la tienda.
        Ejemplo: 'jumbo' → jumbo.vteximg.com.br
        """
        raise NotImplementedError

    def _build_url(self, page_from: int, page_to: int) -> str:
        """Construye la URL de la API VTEX para una página de ofertas."""
        return (
            f"https://{self.vtex_domain}.vteximg.com.br"
            f"/api/catalog_system/pub/products/search"
            f"?O=OrderByBestDiscountDESC"
            f"&fq=specificationFilter_40:Oferta"
            f"&_from={page_from}&_to={page_to}"
        )

    async def scrape(self) -> List[RawOffer]:
        self._log_start()
        offers: List[RawOffer] = []
        delay = settings.vtex_delay_ms / 1000  # ms → segundos

        async with httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept": "application/json",
            },
            follow_redirects=True,
        ) as client:
            for page in range(settings.vtex_max_pages):
                page_from = page * 50
                page_to = page_from + 49
                url = self._build_url(page_from, page_to)

                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    items: list = resp.json()

                    if not items:
                        # Sin más resultados: terminar paginación
                        log.info(
                            "vtex.page_empty",
                            store=self.store_slug,
                            page=page,
                        )
                        break

                    for item in items:
                        parsed = _parse_vtex_product(item, self.store_slug)
                        if parsed:
                            offers.append(parsed)

                    log.info(
                        "vtex.page_ok",
                        store=self.store_slug,
                        page=page,
                        items=len(items),
                        offers_so_far=len(offers),
                    )

                except httpx.HTTPStatusError as exc:
                    log.warning(
                        "vtex.http_error",
                        store=self.store_slug,
                        page=page,
                        status=exc.response.status_code,
                    )
                    break

                except Exception as exc:
                    log.warning(
                        "vtex.request_error",
                        store=self.store_slug,
                        page=page,
                        error=str(exc),
                    )
                    break

                # Delay entre páginas para no sobrecargar la API
                await asyncio.sleep(delay)

        # Deduplicar por SKU (puede haber repetidos entre páginas)
        seen: set[str] = set()
        unique_offers = []
        for offer in offers:
            if offer.sku not in seen:
                seen.add(offer.sku)
                unique_offers.append(offer)

        self._log_result(len(unique_offers))
        return unique_offers
