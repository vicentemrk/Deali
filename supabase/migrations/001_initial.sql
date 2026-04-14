-- 1. stores
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    color_hex TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    brand TEXT,
    store_id UUID REFERENCES stores(id),
    category_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. offers
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    original_price NUMERIC(10,2),
    offer_price NUMERIC(10,2),
    discount_pct NUMERIC(5,2),
    offer_url TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    scraped_at TIMESTAMPTZ DEFAULT now()
);

-- 5. price_history
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    price NUMERIC(10,2),
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 6. promotions
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    store_id UUID REFERENCES stores(id),
    image_url TEXT,
    start_date DATE,
    end_date DATE
);

-- Seed inicial de stores
INSERT INTO stores (name, slug, website_url, color_hex) VALUES
    ('Jumbo',        'jumbo',        'https://www.jumbo.cl',        '#0D9488'),
    ('Líder',        'lider',        'https://www.lider.cl',        '#7E6BC4'),
    ('Unimarc',      'unimarc',      'https://www.unimarc.cl',      '#DC2626'),
    ('aCuenta',      'acuenta',      'https://www.acuenta.cl',      '#BA7517'),
    ('Tottus',       'tottus',       'https://www.tottus.cl',       '#00843D'),
    ('Santa Isabel', 'santa-isabel', 'https://www.santaisabel.cl',  '#E91E63');

-- Row Level Security (RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Public read access for stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access for offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Public read access for price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Public read access for promotions" ON promotions FOR SELECT USING (true);

-- Índices
CREATE INDEX idx_offers_end_date ON offers(end_date);
CREATE INDEX idx_offers_is_active ON offers(is_active);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_store_id ON products(store_id);

-- Vista SQL activa_offers_view
CREATE OR REPLACE VIEW activa_offers_view AS
SELECT 
    o.id AS offer_id,
    o.product_id,
    o.original_price,
    o.offer_price,
    o.discount_pct,
    o.offer_url,
    o.start_date,
    o.end_date,
    o.is_active,
    o.scraped_at,
    p.name AS product_name,
    p.image_url AS product_image_url,
    p.brand AS product_brand,
    p.store_id,
    p.category_id,
    s.name AS store_name,
    s.slug AS store_slug,
    s.color_hex AS store_color_hex,
    s.logo_url AS store_logo_url,
    c.name AS category_name,
    c.slug AS category_slug
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON p.store_id = s.id
JOIN categories c ON p.category_id = c.id
WHERE o.is_active = true AND o.end_date >= CURRENT_DATE;