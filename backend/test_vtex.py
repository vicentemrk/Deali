import httpx
import asyncio

async def probe_categories(store, domain):
    """Prueba diferentes formas de obtener productos con descuento"""
    base = f"https://{domain}.vteximg.com.br/api/catalog_system/pub/products/search"
    
    tests = [
        ("OrderByBestDiscountDESC _from=0", f"{base}?O=OrderByBestDiscountDESC&_from=0&_to=49"),
        ("Bebidas con descuento",           f"{base}?fq=C:/2/&O=OrderByBestDiscountDESC&_from=0&_to=9"),
        ("Lacteos",                         f"{base}?fq=C:/3/&O=OrderByBestDiscountDESC&_from=0&_to=9"),
        ("All products _from=0",            f"{base}?_from=0&_to=49"),
    ]
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=15, verify=False) as client:
        for label, url in tests:
            try:
                r = await client.get(url)
                items = r.json() if r.status_code < 400 else []
                if isinstance(items, list):
                    discounted = [i for i in items 
                                  if i.get('items') and 
                                  i['items'][0].get('sellers') and
                                  i['items'][0]['sellers'][0].get('commertialOffer',{}).get('ListPrice',0) > 
                                  i['items'][0]['sellers'][0].get('commertialOffer',{}).get('Price',0)]
                    print(f"  [{store}] {label}: {r.status_code} → {len(items)} items, {len(discounted)} con descuento")
                else:
                    print(f"  [{store}] {label}: {r.status_code} → no-list")
            except Exception as e:
                print(f"  [{store}] {label}: ERROR {e}")

async def main():
    await probe_categories("jumbo", "jumbo")
    await probe_categories("santaisabel", "santaisabel")
    await probe_categories("unimarc", "unimarc")

asyncio.run(main())
