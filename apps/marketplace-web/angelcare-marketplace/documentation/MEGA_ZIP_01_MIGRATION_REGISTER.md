# Mega ZIP 01 — Migration Register

## Migration

`supabase/migrations/20260731_angelcare_marketplace_mega_zip_01_foundation.sql`

## Character

- additive;
- idempotent table/index/seed creation;
- isolated `angelcare_marketplace_*` namespace;
- no existing table/column rename;
- no table/column deletion;
- RLS enabled;
- direct `anon` and `authenticated` access revoked;
- service-role access explicit;
- seed registry includes all 20 Mega ZIP domains;
- Mega ZIP 01 is active;
- Mega ZIPs 02–20 are truthfully `not_installed`;
- readiness starts unverified rather than falsely ready.

Trigger replacement is limited to the newly created Marketplace `updated_at` triggers.

The migration is delivered but was not executed against the user’s Supabase project.
