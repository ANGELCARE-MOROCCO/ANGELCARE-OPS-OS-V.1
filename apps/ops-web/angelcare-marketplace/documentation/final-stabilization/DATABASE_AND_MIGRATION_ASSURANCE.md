# ANGELCARE Marketplace — Database and Migration Assurance

## Cumulative estate

- Marketplace migrations: 29
- Marketplace rollback files: 13
- Marketplace-created tables: 319
- Tables without RLS in source estate: 0
- Destructive `DROP TABLE`, `DROP COLUMN` or `TRUNCATE`: 0

## Compatibility corrections already incorporated

- canonical Homepage catalogue-category authority;
- Catalog Discovery relation compatibility;
- post-MZ20 module sequence compatibility;
- Conversion module registration;
- Journey Control sequence registration;
- Operations and Reconciliation sequence registration;
- Final Authority canonical module and permission columns;
- cumulative MZ20/Delivery 6 launch-gate compatibility;
- release-record evolution without loss of historical rows.

## Final stabilization migration

**No new database migration is required.**

The final stabilization package adds source corrections, media assets and read-only verification authority. It must not create another domain table or launch record.

## Read-only selected-project preflight

`database-preflight.sql` verifies:

- required cumulative relations;
- Final Authority permissions;
- Final Authority module registration;
- RLS status;
- direct `anon` and `authenticated` DML exposure;
- service-role table authority;
- launch-gate evidence status;
- release-state truth.

It opens a read-only transaction and makes no mutation.
