-- Run in Supabase SQL editor (or psql) against your project database.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS address;
