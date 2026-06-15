from scrapers.vtex.base_vtex import VtexBaseScraper


class SantaIsabelScraper(VtexBaseScraper):
    @property
    def store_slug(self) -> str:
        return "santa-isabel"

    @property
    def vtex_domain(self) -> str:
        return "santaisabel"
