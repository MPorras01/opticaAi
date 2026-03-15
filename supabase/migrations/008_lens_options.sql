CREATE TABLE lens_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('type','material','filter','tint','thickness')),
  name TEXT NOT NULL,
  description TEXT,
  price_addition NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER lens_options_updated_at
  BEFORE UPDATE ON lens_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lens_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lens_options_public_read" ON lens_options
  FOR SELECT USING (is_active = true);

CREATE POLICY "lens_options_admin_all" ON lens_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TABLE order_item_lens_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  lens_option_id UUID REFERENCES lens_options(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_at_purchase NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_item_lens_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oilo_admin_all" ON order_item_lens_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE prescriptions 
  ADD COLUMN IF NOT EXISTS legal_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pd_right NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS pd_left NUMERIC(5,2);

INSERT INTO lens_options (category, name, price_addition, sort_order) VALUES
  ('type','Monofocal',0,1),('type','Bifocal',80000,2),
  ('type','Progresivo',150000,3),('type','Solar',50000,4),
  ('material','CR-39',0,1),('material','Policarbonato',40000,2),
  ('material','Trivex',80000,3),
  ('filter','Antirreflex',30000,1),('filter','Filtro luz azul',45000,2),
  ('filter','UV 400',20000,3),('filter','Fotocromático',90000,4),
  ('filter','Polarizado',70000,5),
  ('tint','Sin tinte',0,1),('tint','Gris',35000,2),
  ('tint','Café',35000,3),('tint','Verde',35000,4),
  ('thickness','Estándar 1.50',0,1),('thickness','Delgado 1.60',60000,2),
  ('thickness','Ultra delgado 1.67',120000,3);
