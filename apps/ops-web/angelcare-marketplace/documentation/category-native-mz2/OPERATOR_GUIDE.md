# ANGELCARE Category-Native Mega ZIP 2 — Operator Guide

## A. Installation

1. Apply the controlled source ZIP.
2. Confirm the static, syntax and semantic gates finish successfully.
3. Copy the ordered additive migration to Supabase SQL Editor and run it once.
4. Do not execute the rollback unless the new customer-experience layer must be disabled while preserving its records.

## B. Activate a real offer

1. Open Mega ZIP 1 Category-Native Admin Studio.
2. Select the exact Experience Schema.
3. Create or update the canonical catalogue offer.
4. Complete FR, EN and AR content.
5. Upload genuine media and alt text.
6. Configure relevant attributes and variants.
7. Bind the canonical price authority.
8. Bind the canonical availability authority.
9. Publish immediately.
10. Open `/angelcare-marketplace/fr/experience/<slug>`.

## C. Customer acceptance test

1. Verify the page identity matches the archetype.
2. Verify irrelevant fields are absent.
3. Select variants and options.
4. Complete contact identity.
5. Complete the category-native configuration.
6. Accept explicit terms/privacy; for non-medical offers, accept the non-medical boundary.
7. Revalidate price and availability.
8. Confirm only when the status is truthful and eligible.
9. Record the canonical outcome reference.
10. Verify the exact selection appears in Mon ANGELCARE and the appropriate operational queue.

## D. Representative journeys

Test at minimum: Flashcards, Montessori kit, digital resource, one-time childcare, recurring childcare, school pickup, overnight care, hotel care, event childcare, preschool admission, Academy course, cohort, certification pathway, school programme, hospitality programme, corporate benefit, Partner OS, Quality Check 360 and managed solution.

## E. Troubleshooting doctrine

- Missing field: correct the Mega ZIP 1 schema or the offer configuration.
- Wrong price: correct Finance/catalogue pricing authority; never hard-code the frontend.
- Wrong availability: correct Inventory, Provider, Academy or programme authority.
- Missing public content: complete the localized source record.
- Failed commit: inspect the server API error and MZ2 evidence table; do not fabricate confirmation.
- Stale customer page: verify publication/cache refresh and schema version.

## F. Runtime evidence

Run:

```bash
MARKETPLACE_BASE_URL="https://your-domain" \
MARKETPLACE_LOCALE="fr" \
MARKETPLACE_ITEM_SLUG="real-published-slug" \
node scripts/angelcare-marketplace/run-category-native-mz2-runtime-smoke.mjs
```

The runner is read-only. It writes a JSON evidence file and fails on connection or server errors.
