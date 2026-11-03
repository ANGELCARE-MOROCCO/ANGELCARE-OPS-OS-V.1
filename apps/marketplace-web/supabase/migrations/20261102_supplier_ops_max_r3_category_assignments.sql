-- ANGELCARE Supplier Ops MAX R3 | additive schema only | no product publication
BEGIN;
ALTER TABLE public.ac_som_selections ADD COLUMN IF NOT EXISTS category_keys text[] NOT NULL DEFAULT '{}'::text[];
UPDATE public.ac_som_selections SET category_keys=ARRAY[category_key] WHERE category_key IS NOT NULL AND (cardinality(category_keys)=0);
ALTER TABLE public.ac_som_selections DROP CONSTRAINT IF EXISTS ac_som_categories_size_guard;
ALTER TABLE public.ac_som_selections ADD CONSTRAINT ac_som_categories_size_guard CHECK(cardinality(category_keys)<=25);
COMMIT;
