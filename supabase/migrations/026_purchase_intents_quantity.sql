ALTER TABLE purchase_intents
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0);
