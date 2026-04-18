import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { UnimarcScraper } from '../unimarcScraper';
import { TottusScraper } from '../tottusScraper';

const originalFetch = global.fetch;

test('UnimarcScraper: parses __NEXT_DATA__ contract from campaign HTML', async () => {
  const scraper = new UnimarcScraper();

  global.fetch = async () => {
    const html = `
      <html>
        <body>
          <script id="__NEXT_DATA__" type="application/json">
            ${JSON.stringify({
              props: {
                pageProps: {
                  dehydratedState: {
                    queries: [
                      {
                        queryKey: ['searchesIntelligence', 'promo'],
                        state: {
                          data: {
                            data: {
                              availableProducts: [
                                {
                                  name: 'Leche Entera 1L',
                                  brand: 'Marca Uno',
                                  detailUrl: '/p/leche-entera-1l',
                                  images: [{ src: 'https://img.example/leche.jpg' }],
                                  categories: ['/lacteos/leches'],
                                  sellers: [{ price: '$1.990', listPrice: '$2.390' }],
                                },
                                {
                                  name: 'Yogurt Natural',
                                  brand: 'Marca Dos',
                                  detailUrl: '/p/yogurt-natural',
                                  images: [{ src: 'https://img.example/yogurt.jpg' }],
                                  categories: ['/lacteos/yogurt'],
                                  sellers: [{ price: '$1.290', listPrice: '$1.690' }],
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            })}
          </script>
        </body>
      </html>
    `;

    return new Response(html, { status: 200 });
  };

  const offers = await scraper.scrape();

  assert.ok(offers.length >= 2, `expected at least 2 offers, got ${offers.length}`);
  assert.equal(offers[0].productName.length > 0, true);
  assert.equal(offers[0].offerPrice > 0, true);
  assert.equal(offers[0].originalPrice > offers[0].offerPrice, true);
  assert.equal(offers[0].offerUrl.startsWith('https://www.unimarc.cl/'), true);

  global.fetch = originalFetch;
});

test('TottusScraper: uses recommended-products API contract without Playwright fallback', async () => {
  const scraper = new TottusScraper();

  const mockProducts = Array.from({ length: 10 }, (_, i) => ({
    displayName: `Arroz ${i + 1}kg`,
    brand: 'Marca Tres',
    imageURL: 'https://img.example/arroz.jpg',
    url: `https://www.tottus.cl/tottus-cl/producto/arroz-${i + 1}kg`,
    categoryPaths: ['Despensa||Arroz'],
    prices: [
      { crossed: false, originalPrice: '$1.590' },
      { crossed: true, originalPrice: '$2.190' },
    ],
  }));

  global.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
    const value = String(input);
    if (!value.includes('/recommended-products/')) {
      return new Response('{}', { status: 404 });
    }

    return new Response(
      JSON.stringify({
        widgets: [
          {
            data: mockProducts,
          },
        ],
      }),
      { status: 200 }
    );
  }) as typeof global.fetch;

  try {
    const offers = await scraper.scrape();

    assert.ok(offers.length >= 1, `expected at least 1 offer, got ${offers.length}`);
    assert.equal(offers[0].productName, 'Arroz 1kg');
    assert.equal(offers[0].offerPrice, 1590);
    assert.equal(offers[0].originalPrice, 2190);
    assert.equal(offers[0].offerUrl.includes('tottus.cl'), true);
  } finally {
    global.fetch = originalFetch;
  }
});
