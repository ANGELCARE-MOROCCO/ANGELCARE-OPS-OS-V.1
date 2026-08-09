# Revenue Digital Twin Architecture

## Runtime flow

```text
Protected Next.js Studio
  → Digital Twin API
  → authority and action allow-list
  → server-only repository
  → Supabase service layer
  → isolated revenue_os_* tables
  → immutable Revenue OS audit
```

## Read flow

The server loads the authoritative Supabase records. When Phase 2 tables are unavailable or empty, it returns clearly labelled `contract-seed` data so the studio remains inspectable without pretending the seeds are validated operating truth.

## Write flow

The mutation API accepts only `create`, `update`, and `retire`. Entity types and fields are allow-listed. Arbitrary table names, raw SQL, external actions, communication sending, strategy execution and deletion are not exposed.

## Model validation

The validator combines deterministic checks with seed-defined governance gaps. It calculates domain completeness and detects missing prices, unprotected margins, unavailable capacities, invalid market availability, broken dependencies, malformed sales journeys and invalid bundles or growth paths.

## Versioning

Each validation cycle can persist a model snapshot in `revenue_os_digital_twin_versions`. Business object updates are logged through the Revenue OS audit and the dedicated change-log domain is available for future approval workflows.

## UX surfaces

The Digital Twin Studio contains fourteen purpose-built areas rather than a generic CRUD table:

1. Executive overview
2. Business units
3. Offers and services
4. Bundles and combinations
5. Customer segments
6. Decision makers
7. Markets and territories
8. Channels and journeys
9. Pricing and margins
10. Capacity and constraints
11. Seasonality
12. Expansion and renewal
13. Revenue dependencies
14. Model validation
