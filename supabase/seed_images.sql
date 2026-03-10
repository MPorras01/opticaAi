-- Seed image updates for OpticaAI development
-- Assigns 2-3 Unsplash images per existing seeded product

begin;

-- Monturas (rectangular / cat-eye)
update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop'
]
where slug = 'ray-ban-clubmaster-rb3016';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop'
]
where slug = 'vogue-vo5276';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop'
]
where slug = 'oakley-metalink-ox8153';

-- Gafas de sol (aviador / cuadrada / ovalada)
update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop'
]
where slug = 'persol-po0714-folding';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop'
]
where slug = 'hawkers-one-polarized';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop'
]
where slug = 'polaroid-pld-6067-s';

-- Deportivas (rectangular / hexagonal / cuadrada)
update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop'
]
where slug = 'adidas-sp0005-performance';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop'
]
where slug = 'nike-maverick-free-ev1097';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop'
]
where slug = 'under-armour-hustle-2-0';

-- Infantiles (redonda / ovalada / cuadrada)
update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&h=600&fit=crop'
]
where slug = 'nano-vista-crew-nao302';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop'
]
where slug = 'miraflex-new-baby-2';

update products
set images = ARRAY[
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop'
]
where slug = 'tommy-kids-tk1045';

update products
set has_ar_overlay = true
where id in (
  select id from products order by random() limit 4
);

commit;
