ALTER TABLE products DROP CONSTRAINT products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text, 'sold'::text]));
