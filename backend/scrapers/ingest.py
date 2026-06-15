"""
Pipeline de ingesta: toma List[RawOffer] de cualquier scraper
y hace upsert en Supabase usando (store_id, sku) como clave de deduplicación.

Flujo:
1. Resuelve store_id desde slug
2. Resuelve category_id desde category_hint (fuzzy match)
3. Upsert products ON CONFLICT (store_id, sku)
4. Upsert offers ON CONFLICT (product_id)
5. INSERT price_history (append-only, siempre)
6. Log en scrape_logs
"""
import asyncio
import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import structlog
from supabase import AsyncClient, acreate_client

from config import settings
from scrapers.models import RawOffer

log = structlog.get_logger(__name__)

# Cache en memoria para el run actual (evita roundtrips repetidos a Supabase)
_store_id_cache: dict[str, str] = {}
_category_id_cache: dict[str, Optional[str]] = {}


async def _get_supabase() -> AsyncClient:
    """Crea cliente Supabase con service_role (permite escritura)."""
    return await acreate_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


def _generate_sku(store_slug: str, product_name: str, brand: Optional[str]) -> str:
    """
    Genera un SKU determinista a partir de los datos del producto
    cuando la tienda no expone un SKU nativo.
    El hash es estable: mismos inputs → mismo SKU siempre.
    """
    raw = f"{store_slug}::{product_name.strip().lower()}::{(brand or '').strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


async def _resolve_store_id(client: AsyncClient, store_slug: str) -> Optional[str]:
    """Obtiene el UUID de la tienda desde su slug (con cache en memoria)."""
    if store_slug in _store_id_cache:
        return _store_id_cache[store_slug]

    resp = (
        await client.table("stores")
        .select("id")
        .eq("slug", store_slug)
        .single()
        .execute()
    )
    if resp.data:
        _store_id_cache[store_slug] = resp.data["id"]
        return resp.data["id"]

    log.error("store.not_found", slug=store_slug)
    return None


async def _resolve_category_id(
    client: AsyncClient, category_hint: Optional[str]
) -> Optional[str]:
    """
    Obtiene UUID de categoría desde el hint del scraper.
    Si no hay hint o no matchea, retorna None (categoría General por default).
    """
    if not category_hint:
        return None

    if category_hint in _category_id_cache:
        return _category_id_cache[category_hint]

    resp = (
        await client.table("categories")
        .select("id")
        .eq("slug", category_hint)
        .single()
        .execute()
    )
    result = resp.data["id"] if resp.data else None
    _category_id_cache[category_hint] = result
    return result


async def ingest(
    offers: List[RawOffer],
    scraper_name: str,
    run_id: Optional[str] = None,
) -> dict:
    """
    Ingesta una lista de RawOffer en Supabase.

    Args:
        offers: lista de ofertas crudas del scraper
        scraper_name: identificador del scraper (ej: 'vtex.jumbo')
        run_id: ID del run de GitHub Actions (para correlación en scrape_logs)

    Returns:
        dict con estadísticas del run: inserted, updated, errors
    """
    if not offers:
        log.warning("ingest.empty", scraper=scraper_name)
        return {"inserted": 0, "updated": 0, "errors": 0}

    run_id = run_id or str(uuid.uuid4())
    store_slug = offers[0].store_slug
    started_at = datetime.now(timezone.utc)

    stats = {"inserted": 0, "updated": 0, "errors": 0}

    client = await _get_supabase()

    # Log inicio del run
    log_entry = {
        "run_id": run_id,
        "store_slug": store_slug,
        "scraper_type": "vtex" if "vtex" in scraper_name else "browser",
        "started_at": started_at.isoformat(),
        "status": "running",
        "offers_found": len(offers),
    }
    log_resp = await client.table("scrape_logs").insert(log_entry).execute()
    log_id = log_resp.data[0]["id"] if log_resp.data else None

    store_id = await _resolve_store_id(client, store_slug)
    if not store_id:
        await _finalize_log(client, log_id, "failed", stats, "store_not_found")
        return stats

    # Procesar cada oferta
    for raw in offers:
        try:
            # Usar SKU nativo si parece válido (no vacío, no genérico)
            sku = raw.sku if raw.sku and len(raw.sku) > 2 else _generate_sku(
                store_slug, raw.product_name, raw.brand
            )

            category_id = await _resolve_category_id(client, raw.category_hint)

            # ── Upsert producto ────────────────────────────────────────────
            product_data = {
                "sku": sku,
                "name": raw.product_name,
                "image_url": raw.image_url,
                "brand": raw.brand,
                "store_id": store_id,
                "category_id": category_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            product_resp = (
                await client.table("products")
                .upsert(product_data, on_conflict="store_id,sku")
                .execute()
            )
            product_id = product_resp.data[0]["id"]

            # ── Upsert oferta ──────────────────────────────────────────────
            offer_data = {
                "product_id": product_id,
                "original_price": raw.original_price,
                "offer_price": raw.offer_price,
                "discount_pct": raw.discount_pct,
                "offer_url": raw.offer_url,
                "is_active": True,
                "scraped_by": scraper_name,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }
            offer_resp = (
                await client.table("offers")
                .upsert(offer_data, on_conflict="product_id")
                .execute()
            )

            # Detecta si fue insert o update
            if offer_resp.data:
                stats["inserted"] += 1
            else:
                stats["updated"] += 1

            # ── Append price_history (siempre, nunca upsert) ──────────────
            await client.table("price_history").insert({
                "product_id": product_id,
                "offer_price": raw.offer_price,
                "original_price": raw.original_price,
                "source": scraper_name,
            }).execute()

        except Exception as exc:
            # Tolera errores por producto: log warning y continúa
            log.warning(
                "ingest.product_error",
                store=store_slug,
                product=raw.product_name,
                error=str(exc),
            )
            stats["errors"] += 1
            continue

    # Finalizar log
    status = "success" if stats["errors"] == 0 else "partial"
    await _finalize_log(client, log_id, status, stats)

    log.info(
        "ingest.complete",
        store=store_slug,
        **stats,
    )
    return stats


async def _finalize_log(
    client: AsyncClient,
    log_id: Optional[str],
    status: str,
    stats: dict,
    error_message: Optional[str] = None,
) -> None:
    """Actualiza el registro de scrape_logs al terminar el run."""
    if not log_id:
        return
    await client.table("scrape_logs").update({
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "offers_inserted": stats.get("inserted", 0),
        "offers_updated": stats.get("updated", 0),
        "error_message": error_message,
    }).eq("id", log_id).execute()
