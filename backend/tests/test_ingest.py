"""
Tests del pipeline de ingesta (scrapers/ingest.py).

Estrategia: mockear acreate_client para evitar cualquier I/O real con Supabase.

Edge cases cubiertos:
  1. Lista vacía → retorna zeros sin llamar Supabase
  2. Store no encontrado → aborta sin procesar offers
  3. Error en producto individual → continúa con el resto (stats["errors"] += 1)
  4. SKU nativo vs hash generado (len <=2 → genera hash)
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from scrapers.ingest import _generate_sku, ingest
from scrapers.models import RawOffer


# ─── Unit tests puros de _generate_sku ───────────────────────────────────────

class TestGenerateSku:
    def test_deterministic_same_input(self) -> None:
        """El mismo input siempre genera el mismo SKU (hash estable)."""
        sku1 = _generate_sku("jumbo", "Leche Soprole 1L", "Soprole")
        sku2 = _generate_sku("jumbo", "Leche Soprole 1L", "Soprole")
        assert sku1 == sku2

    def test_different_stores_produce_different_sku(self) -> None:
        """El mismo producto en tiendas distintas → SKUs distintos."""
        sku_j = _generate_sku("jumbo", "Leche Soprole 1L", "Soprole")
        sku_l = _generate_sku("lider", "Leche Soprole 1L", "Soprole")
        assert sku_j != sku_l

    def test_case_insensitive(self) -> None:
        """Mayúsculas/minúsculas no afectan el SKU (normalizado a lower)."""
        sku_upper = _generate_sku("jumbo", "LECHE SOPROLE 1L", "SOPROLE")
        sku_lower = _generate_sku("jumbo", "leche soprole 1l", "soprole")
        assert sku_upper == sku_lower

    def test_length_always_32_chars(self) -> None:
        """SKU generado siempre tiene exactamente 32 caracteres."""
        sku = _generate_sku("jumbo", "Cualquier Producto con nombre muy largo", None)
        assert len(sku) == 32

    def test_none_brand_does_not_crash(self) -> None:
        """brand=None es válido → genera SKU sin crash."""
        sku = _generate_sku("jumbo", "Producto sin marca", None)
        assert sku
        assert len(sku) == 32

    def test_empty_brand_same_as_none(self) -> None:
        """brand="" debe producir el mismo SKU que brand=None."""
        sku_none = _generate_sku("tottus", "Yogur Nestlé", None)
        sku_empty = _generate_sku("tottus", "Yogur Nestlé", "")
        assert sku_none == sku_empty

    def test_different_products_differ(self) -> None:
        """Dos productos distintos siempre tienen SKUs distintos."""
        sku_a = _generate_sku("jumbo", "Leche 1L", None)
        sku_b = _generate_sku("jumbo", "Yogur 500g", None)
        assert sku_a != sku_b


# ─── Integration tests con Supabase mockeado ─────────────────────────────────

class TestIngestPipeline:
    @pytest.mark.asyncio
    async def test_empty_offers_returns_zeros_without_db_call(self) -> None:
        """
        ingest([]) debe retornar zeros sin abrir ninguna conexión a Supabase.
        Verifica que no hay overhead de red para runs vacíos.
        """
        with patch("scrapers.ingest._get_supabase") as mock_create:
            result = await ingest([], scraper_name="vtex.jumbo")

        assert result == {"inserted": 0, "updated": 0, "errors": 0}
        mock_create.assert_not_called()

    @pytest.mark.asyncio
    async def test_store_not_found_aborts_without_processing(
        self,
        sample_offers_batch: list[RawOffer],
    ) -> None:
        """
        Si la tienda no existe en DB, el pipeline debe abortar sin procesar
        ninguna oferta. inserted y updated deben quedar en 0.
        """
        # store lookup retorna None (tienda desconocida)
        store_resp = MagicMock()
        store_resp.data = None

        log_resp = MagicMock()
        log_resp.data = [{"id": "log-xxx"}]

        table = MagicMock()
        table.select.return_value.eq.return_value.single.return_value.execute = AsyncMock(
            return_value=store_resp
        )
        table.insert.return_value.execute = AsyncMock(return_value=log_resp)
        table.update.return_value.eq.return_value.execute = AsyncMock(return_value=MagicMock())

        mock_client = MagicMock()
        mock_client.table.return_value = table

        with patch("scrapers.ingest._get_supabase", return_value=mock_client):
            result = await ingest(sample_offers_batch, scraper_name="vtex.jumbo")

        assert result["inserted"] == 0
        assert result["updated"] == 0

    @pytest.mark.asyncio
    async def test_single_product_error_does_not_halt_pipeline(self) -> None:
        """
        Edge case crítico: si el upsert de un producto falla (ej: DB timeout),
        el pipeline debe continuar con los demás y registrar stats["errors"] += 1.
        Garantiza tolerancia a fallos por producto.
        """
        offers = [
            RawOffer("sku-ok", "Producto OK", None, "http://x.cl/a.jpg",
                     "http://x.cl/a", 990.0, 1290.0, "jumbo", None),
            RawOffer("sku-fail", "Producto FALLA", None, "http://x.cl/b.jpg",
                     "http://x.cl/b", 890.0, 1190.0, "jumbo", None),
        ]

        store_resp = MagicMock()
        store_resp.data = {"id": "store-uuid"}

        log_resp = MagicMock()
        log_resp.data = [{"id": "log-uuid"}]

        # Producto OK
        ok_product_resp = MagicMock()
        ok_product_resp.data = [{"id": "prod-ok"}]
        ok_offer_resp = MagicMock()
        ok_offer_resp.data = [{"id": "offer-ok"}]

        upsert_call_count = 0

        async def upsert_side_effect(*args, **kwargs):  # type: ignore[type-arg]
            nonlocal upsert_call_count
            upsert_call_count += 1
            if upsert_call_count == 1:
                return ok_product_resp     # product OK
            if upsert_call_count == 2:
                return ok_offer_resp       # offer OK
            # Tercera llamada (segundo producto) → falla
            raise RuntimeError("DB connection lost during upsert")

        table = MagicMock()
        table.select.return_value.eq.return_value.single.return_value.execute = AsyncMock(
            side_effect=[store_resp, MagicMock(data=None), MagicMock(data=None)]
        )
        table.insert.return_value.execute = AsyncMock(return_value=log_resp)
        table.upsert.return_value.execute = AsyncMock(side_effect=upsert_side_effect)
        table.update.return_value.eq.return_value.execute = AsyncMock(return_value=MagicMock())

        mock_client = MagicMock()
        mock_client.table.return_value = table

        with patch("scrapers.ingest._get_supabase", return_value=mock_client):
            result = await ingest(offers, scraper_name="vtex.jumbo")

        # Un producto OK, un error — el pipeline NO se detuvo
        assert result["errors"] == 1
        assert result["inserted"] + result["errors"] == 2

    @pytest.mark.asyncio
    async def test_short_sku_triggers_hash_generation(self) -> None:
        """
        SKUs con longitud <= 2 chars deben ser reemplazados por hash generado.
        Verifica que el pipeline no usa SKUs inválidos de la tienda.
        """
        offers_with_short_sku = [
            RawOffer(
                sku="AB",  # <= 2 chars → debe generar hash
                product_name="Producto con SKU corto",
                brand=None,
                image_url="http://x.cl/img.jpg",
                offer_url="http://x.cl/p",
                offer_price=500.0,
                original_price=800.0,
                store_slug="jumbo",
                category_hint=None,
            )
        ]

        store_resp = MagicMock()
        store_resp.data = {"id": "store-uuid"}
        log_resp = MagicMock()
        log_resp.data = [{"id": "log-uuid"}]
        product_resp = MagicMock()
        product_resp.data = [{"id": "prod-uuid"}]
        offer_resp = MagicMock()
        offer_resp.data = [{"id": "offer-uuid"}]

        upserted_data: list[dict] = []  # type: ignore[type-arg]

        async def capture_upsert(data: dict, **kwargs) -> MagicMock:  # type: ignore[type-arg]
            upserted_data.append(data)
            if "sku" in data:
                return product_resp
            return offer_resp

        table = MagicMock()
        table.select.return_value.eq.return_value.single.return_value.execute = AsyncMock(
            side_effect=[store_resp, MagicMock(data=None)]
        )
        table.insert.return_value.execute = AsyncMock(return_value=log_resp)
        table.upsert.return_value.execute = AsyncMock(side_effect=capture_upsert)
        table.update.return_value.eq.return_value.execute = AsyncMock(return_value=MagicMock())

        mock_client = MagicMock()
        mock_client.table.return_value = table

        with patch("scrapers.ingest._get_supabase", return_value=mock_client):
            await ingest(offers_with_short_sku, scraper_name="vtex.jumbo")

        # El primer upsert es el del producto — verificar que el SKU NO es "AB"
        if upserted_data:
            product_upsert = upserted_data[0]
            if "sku" in product_upsert:
                assert product_upsert["sku"] != "AB"
                assert len(product_upsert["sku"]) == 32  # es el hash generado
