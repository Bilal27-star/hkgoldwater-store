-- Read-only: inspect product_images constraints and indexes before/after migration.
-- Run in Supabase SQL Editor.

SELECT
  c.conname,
  c.contype,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'product_images'
ORDER BY c.contype, c.conname;

SELECT
  i.relname AS index_name,
  ix.indisunique AS is_unique,
  pg_get_indexdef(ix.indexrelid) AS index_def
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'product_images'
ORDER BY i.relname;
