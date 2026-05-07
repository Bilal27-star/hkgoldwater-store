-- Safe additive migration for Supabase/public.users (run in SQL editor).
-- Adjust table/schema name if your table differs.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS commune TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;

