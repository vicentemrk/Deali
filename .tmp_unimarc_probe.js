const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport:{width:1366,height:900},
    extraHTTPHeaders:{'Accept-Language':'es-CL,es;q=0.9'}
  })).newPage();

  const url = 'https://www.unimarc.cl/ofertas/black-ofertazo';
  await page.goto(url, { waitUntil:'domcontentloaded', timeout:45000 });
  await page.waitForTimeout(5000);

  const selectors = [
    '[class*="StyledCard"]',
    'a.containerCard',
    '[data-testid="card-name"]',
    'a[href*="/p/"]',
    '.product-card',
    '.ProductCard',
    'article[class*="product"]'
  ];
  for (const s of selectors) {
    console.log(s, await page.locator(s).count());
  }

  console.log('finalUrl', page.url());
  const body = (await page.textContent('body') || '').replace(/\s+/g, ' ');
  console.log('bodyHead', body.slice(0, 700));
  console.log('robot?', /robot|captcha|attention required|cloudflare|human/i.test(body));

  await browser.close();
})();
