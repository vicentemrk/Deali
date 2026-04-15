const { chromium } = require('playwright');
(async () => {
  const urls = [
    'https://www.unimarc.cl/ofertas/black-ofertazo?promotionsOnly=true',
    ...Array.from({length: 6}, (_, i) => `https://www.unimarc.cl/ofertas/black-ofertazo?promotionsOnly=true&page=${i+2}`),
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'es-CL,es;q=0.9' },
  });

  for (const url of urls) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4000);
      const cntProduct = await page.locator('a[href*="/product/"]').count();
      const cntStyled = await page.locator('[class*="StyledCard"]').count();
      const cntName = await page.locator('[data-testid="card-name"]').count();
      const finalUrl = page.url();
      const text = ((await page.textContent('body')) || '').replace(/\s+/g, ' ').slice(0, 280);
      console.log(JSON.stringify({ url, finalUrl, cntProduct, cntStyled, cntName, bodyStart: text }, null, 0));
    } catch (e) {
      console.log(JSON.stringify({ url, err: e.message }));
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();
