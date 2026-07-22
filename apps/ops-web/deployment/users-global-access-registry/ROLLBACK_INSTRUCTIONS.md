# Rollback Instructions

## Application rollback

The overlay installer creates a timestamped pre-injection backup and a ready-to-run rollback script. Execute the rollback script printed by the installer.

Application rollback should normally occur before database rollback.

## Registry version recovery

For a bad classification or publication, prefer the in-application **Restore version** action. It restores the selected snapshot as a new active version, marks resources introduced after that version as missing/stale, and preserves audit history.

## Database rollback

Use only after application code has been rolled back and the new tables have been exported:

```text
apps/ops-web/supabase/migrations/20260721_users_global_access_registry_route_family_scanner.rollback.sql
```

The guarded SQL rollback removes the v2 resource/version/grant tables and additive compatibility columns. It preserves the existing Phase 1 module and route registry tables.

## Data warning

Do not execute the SQL rollback while production still depends on:

- `access_resource_registry`
- `access_registry_versions`
- `access_resource_grants`

Export those tables first if they contain production history or assignments.
