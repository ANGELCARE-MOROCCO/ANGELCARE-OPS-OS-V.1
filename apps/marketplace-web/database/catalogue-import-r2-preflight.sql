-- READ ONLY. Run first in the Marketplace SQL editor.
-- All required rows must report present=true. No relation casts on absent tables.
select name, to_regclass('public.'||name) is not null as present,
 case when name='angelcare_marketplace_population_batches' then obj_description(to_regclass('public.'||name),'pg_class') else null end as coordinator_owner
from (values
 ('angelcare_marketplace_catalog_items'),('angelcare_marketplace_catalog_variants'),
 ('angelcare_marketplace_catalog_item_media'),('angelcare_marketplace_catalog_availability'),
 ('angelcare_marketplace_catalog_categories'),('angelcare_marketplace_catalog_item_categories'),
 ('angelcare_marketplace_finance_price_rules'),('angelcare_marketplace_homepage_placements'),
 ('angelcare_marketplace_experience_schemas'),('angelcare_marketplace_population_batches')
) required(name);
-- If only Population R1 is absent, use the existing repository migration:
-- database/catalogue-population-r1.sql, then rerun this read-only preflight.
-- Expected owner of the coordinator: ANGELCARE_CATALOGUE_POPULATION_R1.
