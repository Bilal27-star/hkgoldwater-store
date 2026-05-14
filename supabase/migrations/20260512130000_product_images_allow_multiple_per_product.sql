-- product_images: allow multiple rows per product (gallery).
-- Safe: no DELETE of rows; drops UNIQUE(product_id) or equivalent; keeps foreign keys unchanged.
--
-- Apply: `supabase db push` (linked project) or paste into Supabase SQL Editor.
-- Inspect first: backend/sql/diagnostics_product_images_constraints.sql

-- 1) sort_order column (ordering for gallery)
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- 2) Stable per-product ordering: 0..n-1 by (product_id, previous sort_order, ctid)
--    Uses ctid so we do not depend on a specific primary-key column name.
WITH numbered AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY product_id
      ORDER BY sort_order NULLS LAST, ctid
    ) - 1 AS new_ord
  FROM public.product_images
)
UPDATE public.product_images AS pi
SET sort_order = numbered.new_ord
FROM numbered
WHERE pi.ctid = numbered.ctid;

-- 3) Drop UNIQUE constraints that reference ONLY product_id (wrong for galleries)
DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'product_images'
      AND c.contype = 'u'
      AND (SELECT count(*)::int FROM unnest(c.conkey) AS u(attnum)) = 1
      AND (
        SELECT a.attname
        FROM unnest(c.conkey) AS u(attnum)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = u.attnum
         AND NOT a.attisdropped
        LIMIT 1
      ) = 'product_id'
  LOOP
    EXECUTE format('ALTER TABLE public.product_images DROP CONSTRAINT %I', conname);
  END LOOP;
END $$;

-- 4) Drop standalone UNIQUE INDEX on product_id only (if created as INDEX, not CONSTRAINT)
DO $$
DECLARE
  idxname text;
BEGIN
  FOR idxname IN
    SELECT i.relname
    FROM pg_index x
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'product_images'
      AND x.indisunique
      AND NOT x.indisprimary
      AND (SELECT count(*)::int FROM unnest(x.indkey) AS u(attnum)) = 1
      AND (
        SELECT a.attname
        FROM unnest(x.indkey) AS u(attnum)
        JOIN pg_attribute a
          ON a.attrelid = t.oid
         AND a.attnum = u.attnum
         AND NOT a.attisdropped
        LIMIT 1
      ) = 'product_id'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', idxname);
  END LOOP;
END $$;

-- 5) One row per (product_id, sort_order) — many images per product, stable ordering
DROP INDEX IF EXISTS public.product_images_product_id_sort_order_uidx;
CREATE UNIQUE INDEX product_images_product_id_sort_order_uidx
  ON public.product_images (product_id, sort_order);
