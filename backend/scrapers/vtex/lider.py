from scrapers.vtex.base_vtex import VtexBaseScraper


class LiderScraper(VtexBaseScraper):
    @property
    def store_slug(self) -> str:
        return "lider"

    @property
    def vtex_domain(self) -> str:
        # Líder usa el dominio VTEX de Walmart Chile
        return "lider"
