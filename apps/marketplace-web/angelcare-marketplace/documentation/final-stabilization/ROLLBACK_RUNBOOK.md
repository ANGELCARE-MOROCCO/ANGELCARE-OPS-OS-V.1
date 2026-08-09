# ANGELCARE Marketplace — Data-Preserving Rollback Runbook

## Rollback triggers

- production 5xx spike;
- checkout or confirmation failure;
- duplicate canonical outcomes;
- family/tenant/territory leakage;
- unauthorized document exposure;
- false price, availability, payment, refund or settlement state;
- critical Arabic or public-route breakage;
- destructive migration behavior;
- monitoring loss during release window.

## Source rollback

1. Pause release traffic or affected feature flags.
2. Preserve logs, request references and monitoring evidence.
3. Restore the last approved source artifact.
4. Do not delete orders, journeys, fulfillment evidence, disputes or Finance history.
5. Re-run critical runtime smoke.
6. Record the rollback decision, actor, reason and affected territories/locales.

## Database rollback

Final Stabilization introduces no migration. Earlier cumulative rollback files are history-preserving and must be selected according to the originating delivery. Never run a broad destructive rollback against production records.

## Re-entry

A rolled-back release returns to `blocked` until the defect is corrected, verified and re-approved under separation of duties.
