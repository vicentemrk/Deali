# 🛒 Deali Supermarket Tracker

![Deali Logo / Header](https://ui-avatars.com/api/?name=Deali&font-size=0.33&background=0D9488&color=fff&size=800x200&bold=true)

**Deali** es un rastreador hiper-optimizado de ofertas de supermercados chilenos (Jumbo, Líder, Unimarc, Tottus, aCuenta, Santa Isabel). Diseñado con una interfaz y respaldado por una red de inyección de datos anti-bloqueos extremadamente rápida.

---

## 🚀 Características Clave

- **Estética Premium & Visual Excellence:** Tarjetas de productos diseñadas meticulosamente con efectos *Hover*, *Glassmorphism*, transiciones dinámicas y una tipografía jerárquica potente.
- **Scraping Nativo "Stealth Mode":** Se descartó por completo el "overhead" de navegadores automatizados (como Playwright/Puppeteer). Deali interactúa a nivel nativo con los *endpoints* ocultos y APIs GraphQL (ej. VTEX Image Cache `vteximg.com.br`) para recolectar datos instantáneamente y evitar ser bloqueado por Cloudflare o Datadome.
- **Integridad de BBDD Reactiva:** Sistema robusto basado en **Supabase**. Usa restricciones estructurales fuertes (`UNIQUE product_id`) y una capa de inserción continua (`UPSERT`) que evita la clonación de datos.
- **Alertas en Tiempo Real:** Las actualizaciones de precios se agrupan utilizando canales de `Supabase Realtime`, permitiendo ver las rebajas en el frontend el mismo segundo que el scraper las inserta.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React, Next.js 14, Tailwind CSS (Custom Color Palette) |
| **Backend / DB** | Supabase (PostgreSQL), Edge Functions, Realtime Channels |
| **Data Ingestion (Scrapers)** | Node.js nativo (Fetch API, TypeScript, Stealth wrappers) |
| **Despliegue** | Vercel (Front) / Supabase (Back) |


## 📜 Licencia

Este proyecto se encuentra bajo los términos de la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles y libertad de uso.
