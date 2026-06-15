from scrapers.vtex.base_vtex import VtexBaseScraper


class UnimarScraper(VtexBaseScraper):
    @property
    def store_slug(self) -> str:
        return "unimarc"

    @property
    def vtex_domain(self) -> str:
        return "unimarc"
