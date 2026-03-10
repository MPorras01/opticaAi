-- Seed data for OpticaAI (Colombia)
-- This seed inserts categories and products only.
-- Users are managed by Supabase Auth and profiles trigger.

begin;

-- =========================
-- Categories (4)
-- =========================
insert into public.categories (name, slug, description, image_url, is_active)
values
  ('Monturas', 'monturas', 'Monturas oftalmicas para uso diario con estilos clasicos y modernos.', null, true),
  ('Gafas de Sol', 'gafas-de-sol', 'Proteccion UV con disenos urbanos y premium para diferentes estilos.', null, true),
  ('Deportivas', 'deportivas', 'Modelos ligeros y resistentes para actividad fisica y alto movimiento.', null, true),
  ('Infantiles', 'infantiles', 'Gafas para ninos con materiales flexibles, seguros y comodos.', null, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  is_active = excluded.is_active;

-- =========================
-- Products (12)
-- At least 3 per category
-- =========================
insert into public.products (
  category_id,
  name,
  slug,
  description,
  price,
  compare_at_price,
  stock,
  brand,
  color,
  material,
  frame_shape,
  gender,
  is_active,
  has_ar_overlay,
  images,
  ar_overlay_url,
  metadata
)
values
  -- Monturas (3)
  (
    (select id from public.categories where slug = 'monturas'),
    'Ray-Ban Clubmaster RB3016',
    'ray-ban-clubmaster-rb3016',
    'Montura iconica semi-rimless con look retro elegante. Ideal para uso diario y oficina.',
    620000.00,
    744000.00,
    12,
    'Ray-Ban',
    'Carey/Dorado',
    'acetato',
    'rectangular',
    'unisex',
    true,
    true,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'monturas'),
    'Vogue VO5276',
    'vogue-vo5276',
    'Montura liviana de linea femenina con acabado moderno. Comoda para jornadas largas.',
    360000.00,
    432000.00,
    15,
    'Vogue',
    'Negro Mate',
    'acetato',
    'cat-eye',
    'mujer',
    true,
    false,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'monturas'),
    'Oakley Metalink OX8153',
    'oakley-metalink-ox8153',
    'Diseño deportivo-ejecutivo en metal con alta durabilidad. Excelente para formula permanente.',
    540000.00,
    648000.00,
    9,
    'Oakley',
    'Grafito',
    'metal',
    'rectangular',
    'hombre',
    true,
    true,
    '{}',
    null,
    '{}'::jsonb
  ),

  -- Gafas de Sol (3)
  (
    (select id from public.categories where slug = 'gafas-de-sol'),
    'Persol PO0714 Folding',
    'persol-po0714-folding',
    'Modelo plegable premium con lentes de alta proteccion UV. Estilo clasico para clima tropical.',
    850000.00,
    1020000.00,
    6,
    'Persol',
    'Havana',
    'acetato',
    'aviador',
    'unisex',
    true,
    true,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'gafas-de-sol'),
    'Hawkers One Polarized',
    'hawkers-one-polarized',
    'Gafa urbana con lente polarizado y montura ligera. Excelente relacion precio-beneficio.',
    220000.00,
    264000.00,
    20,
    'Hawkers',
    'Negro',
    'plastico',
    'cuadrada',
    'unisex',
    true,
    false,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'gafas-de-sol'),
    'Polaroid PLD 6067/S',
    'polaroid-pld-6067-s',
    'Montura comoda con proteccion UV400 y lente polarizado. Ideal para manejo y exteriores.',
    280000.00,
    336000.00,
    11,
    'Polaroid',
    'Azul Marino',
    'mixto',
    'ovalada',
    'mujer',
    true,
    false,
    '{}',
    null,
    '{}'::jsonb
  ),

  -- Deportivas (3)
  (
    (select id from public.categories where slug = 'deportivas'),
    'Adidas SP0005 Performance',
    'adidas-sp0005-performance',
    'Armazon envolvente con ajuste firme para entrenamiento. Resistente al sudor y movimientos rapidos.',
    310000.00,
    372000.00,
    14,
    'Adidas',
    'Rojo/Negro',
    'mixto',
    'rectangular',
    'hombre',
    true,
    true,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'deportivas'),
    'Nike Maverick Free EV1097',
    'nike-maverick-free-ev1097',
    'Modelo deportivo flexible para ciclismo y running. Buen campo visual y peso reducido.',
    340000.00,
    408000.00,
    8,
    'Nike',
    'Blanco',
    'plastico',
    'hexagonal',
    'unisex',
    true,
    true,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'deportivas'),
    'Under Armour Hustle 2.0',
    'under-armour-hustle-2-0',
    'Gafa de alto rendimiento para uso outdoor. Montura estable y comoda para uso prolongado.',
    295000.00,
    354000.00,
    10,
    'Under Armour',
    'Verde Militar',
    'mixto',
    'cuadrada',
    'hombre',
    true,
    false,
    '{}',
    null,
    '{}'::jsonb
  ),

  -- Infantiles (3)
  (
    (select id from public.categories where slug = 'infantiles'),
    'Nano Vista Crew NAO302',
    'nano-vista-crew-nao302',
    'Montura infantil flexible con bisagras resistentes. Diseñada para uso escolar diario.',
    260000.00,
    312000.00,
    18,
    'Nano Vista',
    'Morado',
    'plastico',
    'redonda',
    'niños',
    true,
    false,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'infantiles'),
    'Miraflex New Baby 2',
    'miraflex-new-baby-2',
    'Modelo para ninos pequenos con material hipoalergenico y ultra liviano. Ajuste suave y seguro.',
    190000.00,
    228000.00,
    16,
    'Miraflex',
    'Azul Cielo',
    'plastico',
    'ovalada',
    'niños',
    true,
    false,
    '{}',
    null,
    '{}'::jsonb
  ),
  (
    (select id from public.categories where slug = 'infantiles'),
    'Tommy Kids TK1045',
    'tommy-kids-tk1045',
    'Montura infantil con estilo moderno y buena resistencia al impacto. Ideal para etapa escolar.',
    275000.00,
    330000.00,
    7,
    'Tommy Kids',
    'Rojo',
    'acetato',
    'cuadrada',
    'niños',
    true,
    true,
    '{}',
    null,
    '{}'::jsonb
  )
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  stock = excluded.stock,
  brand = excluded.brand,
  color = excluded.color,
  material = excluded.material,
  frame_shape = excluded.frame_shape,
  gender = excluded.gender,
  is_active = excluded.is_active,
  has_ar_overlay = excluded.has_ar_overlay,
  images = excluded.images,
  ar_overlay_url = excluded.ar_overlay_url,
  metadata = excluded.metadata;

commit;

-- Manual admin setup:
-- 1) Create/login the user in Supabase Auth first.
-- 2) Then promote role in SQL editor:
--    update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';
