"""
RawOffer: contrato de datos entre scrapers y el pipeline de ingesta.
Todos los scrapers deben retornar List[RawOffer].
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class RawOffer:
    """
    Datos crudos de una oferta extraída de un supermercado.
    El SKU puede ser nativo (VTEX) o generado por hash (browser scrapers).
    """
    # Identidad del producto
    sku: str                          # ID único por tienda (nativo o hash)
    product_name: str
    brand: Optional[str]
    image_url: str
    offer_url: str

    # Precios
    offer_price: float
    original_price: Optional[float]

    # Metadata del scraper
    store_slug: str
    category_hint: Optional[str]      # slug aproximado para categorización

    # Calculado automáticamente si hay ambos precios
    discount_pct: Optional[float] = field(default=None)

    def __post_init__(self) -> None:
        """Calcula discount_pct si no fue provisto y hay datos para calcularlo."""
        if (
            self.discount_pct is None
            and self.original_price is not None
            and self.original_price > 0
            and self.offer_price < self.original_price
        ):
            self.discount_pct = round(
                (1 - self.offer_price / self.original_price) * 100, 2
            )
