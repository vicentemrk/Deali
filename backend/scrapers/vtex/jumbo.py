from scrapers.vtex.base_vtex import VtexBaseScraper


class JumboScraper(VtexBaseScraper):
    @property
    def store_slug(self) -> str:
        return "jumbo"

    @property
    def vtex_domain(self) -> str:
        return "jumbo"
