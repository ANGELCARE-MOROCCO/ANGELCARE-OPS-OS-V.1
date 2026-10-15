select indexname, indexdef
from pg_indexes
where schemaname='public' and tablename='angelcare_marketplace_public_inquiries'
 and indexname='angelcare_contact_submission_key_r1_uq';
