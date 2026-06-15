# Deali

Comparador de ofertas de supermercados chilenos.

## Arquitectura

```
Deali/
├── backend/          # Python 3.12 — scrapers + ingesta
│   ├── scrapers/
│   │   ├── vtex/     # Jumbo, Líder, Santa Isabel (VTEX JSON API)
│   │   └── browser/  # Tottus, Unimarc, aCuenta (Playwright)
│   ├── run_vtex.py
│   ├── run_browser.py
│   └── tests/        # pytest
├── supabase/
│   └── migrations/
│       └── 100_v2_rebuild.sql   # Schema v2 — source of truth
└── .github/workflows/
    ├── scraper-vtex.yml     # Cron cada 30min
    └── scraper-browser.yml  # Cron cada 6h
```

## Stack

| Capa | Tecnología |
|---|---|
| Scrapers API | Python 3.12 + httpx + selectolax |
| Scrapers Browser | Playwright-Python + curl-cffi (anti-detect TLS) |
| DB / BaaS | Supabase (PostgreSQL + PostgREST + RLS) |
| CI/CD | GitHub Actions |
| Frontend (WIP) | React 18 + Vite 5 + TailwindCSS v4 + PWA |

## Licencia

MIT