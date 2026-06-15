"""
Fixtures compartidas para todos los tests de Deali backend.

Estrategia de mocking:
- respx: intercepta httpx sin hacer I/O real (para scrapers VTEX)
- AsyncMock + MagicMock: simula el AsyncClient de Supabase
"""
import os

# Inyectar variables de entorno mínimas ANTES de cualquier import de módulos
# del proyecto, para que config.Settings() pueda instanciarse sin .env real.
# Los valores son ficticios — los tests mockean toda la capa de I/O.
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key-placeholder")
import pytest
from unittest.mock import AsyncMock, MagicMock

from scrapers.models import RawOffer


@pytest.fixture
def sample_raw_offer() -> RawOffer:
    """RawOffer válido de referencia para tests de ingest."""
    return RawOffer(
        sku="789012",
        product_name="Leche Soprole Semidescremada 1L",
        brand="Soprole",
        image_url="https://img.jumbo.cl/leche.jpg",
        offer_url="https://www.jumbo.cl/leche-soprole",
        offer_price=990.0,
        original_price=1290.0,
        store_slug="jumbo",
        category_hint="lacteos",
    )


@pytest.fixture
def sample_offers_batch(sample_raw_offer: RawOffer) -> list[RawOffer]:
    """Batch de 3 RawOffers para tests de ingest masivo."""
    return [
        sample_raw_offer,
        RawOffer(
            sku="111222",
            product_name="Pan Bimbo Molde 500g",
            brand="Bimbo",
            image_url="https://img.jumbo.cl/pan.jpg",
            offer_url="https://www.jumbo.cl/pan-bimbo",
            offer_price=1490.0,
            original_price=1990.0,
            store_slug="jumbo",
            category_hint="despensa",
        ),
        RawOffer(
            sku="333444",
            product_name="Coca-Cola 1.5L",
            brand="Coca-Cola",
            image_url="https://img.jumbo.cl/coca.jpg",
            offer_url="https://www.jumbo.cl/coca-cola",
            offer_price=890.0,
            original_price=1190.0,
            store_slug="jumbo",
            category_hint="bebidas",
        ),
    ]


def _make_supabase_mock(
    store_data: dict | None = None,
    category_data: dict | None = None,
    product_data: list | None = None,
) -> AsyncMock:
    """
    Construye un mock del AsyncClient de Supabase con respuestas configurables.
    Simula la cadena: .table().select().eq().single().execute()
    """
    # Valores por defecto
    if store_data is None:
        store_data = {"id": "store-uuid-123"}
    if product_data is None:
        product_data = [{"id": "prod-uuid-789"}]

    # Respuestas de Supabase
    store_resp = MagicMock()
    store_resp.data = store_data

    cat_resp = MagicMock()
    cat_resp.data = category_data  # None = sin categoría (válido)

    product_resp = MagicMock()
    product_resp.data = product_data

    offer_resp = MagicMock()
    offer_resp.data = [{"id": "offer-uuid-000"}]

    log_resp = MagicMock()
    log_resp.data = [{"id": "log-uuid-111"}]

    # Mock de la cadena de llamadas de Supabase
    table_mock = MagicMock()

    # select().eq().single().execute() → para stores y categories
    table_mock.select.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        side_effect=[store_resp, cat_resp, cat_resp, cat_resp]  # store + 3 categories
    )

    # insert().execute() → para scrape_logs y price_history
    table_mock.insert.return_value.execute = AsyncMock(return_value=log_resp)

    # upsert().execute() → para products y offers
    table_mock.upsert.return_value.execute = AsyncMock(
        side_effect=[product_resp, offer_resp, product_resp, offer_resp, product_resp, offer_resp]
    )

    # update().eq().execute() → para scrape_logs al finalizar
    table_mock.update.return_value.eq.return_value.execute = AsyncMock(return_value=MagicMock())

    client = AsyncMock()
    client.table.return_value = table_mock
    return client


@pytest.fixture
def mock_supabase_client() -> AsyncMock:
    """Mock del AsyncClient de Supabase con datos válidos por defecto."""
    return _make_supabase_mock()


@pytest.fixture
def mock_supabase_store_not_found() -> AsyncMock:
    """Mock donde la tienda NO existe en la DB (store lookup retorna None)."""
    return _make_supabase_mock(store_data=None)
