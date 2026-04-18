// Test API de Jumbo - probar múltiples endpoints
(async () => {
  const endpoints = [
    // Diferentes dominios VTEX posibles
    'https://jumbo.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=*&_from=0&_to=10',
    'https://jumbo.vteximg.com.br/api/catalog_system/pub/products/search?ft=*&_from=0&_to=10',
    'https://www.jumbo.cl/api/catalog/search?q=*&offset=0&limit=10',
  ];

  for (const url of endpoints) {
    try {
      console.log(`\n[Test] Probando: ${url}`);
      
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        }
      });
      
      console.log(`  Status: ${resp.status}`);
      
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          console.log(`  ✓ Array con ${data.length} productos`);
          if (data.length > 0) {
            const first: any = data[0];
            console.log(`    - Claves: ${Object.keys(first).join(', ').substring(0, 80)}`);
            if (first.priceRange || first.price || first.prices) {
              console.log(`    - ✓ Tiene información de precio`);
            }
          }
        } else {
          console.log(`  Tipo: ${typeof data}`);
          const keys = Object.keys(data as Record<string, any>);
          console.log(`  Claves principales: ${keys.slice(0, 5).join(', ')}`);
        }
      }
    } catch (e: any) {
      console.log(`  ✗ Error: ${e.message}`);
    }
  }
  
  process.exit(0);
})();
