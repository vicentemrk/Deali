-- Add new categories: Electrohogar and Mascotas
INSERT INTO categories (name, slug, parent_id, created_at)
VALUES 
  ('Electrohogar', 'electrohogar', NULL, now()),
  ('Mascotas', 'mascotas', NULL, now())
ON CONFLICT (slug) DO NOTHING;
