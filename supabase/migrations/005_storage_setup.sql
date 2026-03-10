-- Bucket para imagenes de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket especifico para overlays AR (solo PNG con transparencia)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ar-overlays',
  'ar-overlays',
  true,
  3145728,
  ARRAY['image/png']
) ON CONFLICT (id) DO NOTHING;

-- Politica: cualquiera puede VER las imagenes (bucket publico)
CREATE POLICY "Public read products images"
ON storage.objects FOR SELECT
USING (bucket_id IN ('products', 'ar-overlays'));

-- Politica: solo admins pueden SUBIR imagenes
CREATE POLICY "Admins upload products images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('products', 'ar-overlays')
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politica: solo admins pueden ELIMINAR imagenes
CREATE POLICY "Admins delete products images"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('products', 'ar-overlays')
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
