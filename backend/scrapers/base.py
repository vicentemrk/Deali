"""
BaseScraper: clase abstracta que todos los scrapers deben implementar.
Define el contrato: cada scraper recibe config y retorna List[RawOffer].
"""
from abc import ABC, abstractmethod
from typing import List

import structlog

from scrapers.models import RawOffer

log = structlog.get_logger(__name__)


class BaseScraper(ABC):
    """
    Contrato base para todos los scrapers de Deali v2.

    Subclasses deben implementar:
        - store_slug: identificador único de la tienda
        - scrape(): lógica de extracción, retorna lista de ofertas crudas

    El manejo de errores es responsabilidad del caller (ingest.py),
    pero cada scraper debe ser tolerante a fallos individuales de producto
    y nunca lanzar excepciones que paralicen el run completo.
    """

    @property
    @abstractmethod
    def store_slug(self) -> str:
        """Slug único de la tienda. Debe coincidir con el slug en la DB."""
        ...

    @property
    @abstractmethod
    def scraper_type(self) -> str:
        """Tipo de scraper: 'vtex' o 'browser'."""
        ...

    @abstractmethod
    async def scrape(self) -> List[RawOffer]:
        """
        Ejecuta el scraping y retorna las ofertas encontradas.

        Debe:
        - Ser tolerante a errores por producto (log warning, continuar)
        - Nunca retornar duplicados de SKU
        - Siempre retornar lista (vacía si no hay datos)
        """
        ...

    def _log_start(self) -> None:
        log.info("scraper.start", store=self.store_slug, type=self.scraper_type)

    def _log_result(self, count: int) -> None:
        log.info("scraper.done", store=self.store_slug, offers_found=count)
