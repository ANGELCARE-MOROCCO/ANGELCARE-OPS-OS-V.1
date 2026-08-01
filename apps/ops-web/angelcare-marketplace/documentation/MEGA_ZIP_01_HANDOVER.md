# Mega ZIP 01 — Handover

## Apply location

Repository root must contain `apps/ops-web`. Run the package’s `APPLY_MEGA_ZIP_01.sh` from the extracted delivery root.

The script:

- validates the target;
- refuses to operate outside `apps/ops-web`;
- backs up a pre-existing Marketplace domain if one exists;
- copies only the isolated domain, thin adapters, migration, verifier and targeted tsconfig;
- runs the static contractual verifier;
- does not run a build, migration, Git operation or deployment.

## Then execute in the target environment

```bash
cd angelcare-platform/apps/ops-web
npx tsc -p tsconfig.angelcare-marketplace-mega-zip-01.json --noEmit --pretty false
node scripts/angelcare-marketplace/verify-mega-zip-01.mjs
```

Apply the migration through the organization’s normal Supabase process, then perform the connected runtime checklist documented in `MEGA_ZIP_01_QA_EVIDENCE.md`.

## Rollback

Before copying, the apply script creates a timestamped backup when `angelcare-marketplace` or its host adapters already exist. The database migration is additive; rollback must be reviewed separately and must not delete records casually.

## Acceptance status

The artifact is delivered as a complete source package with static evidence. Contractual runtime acceptance remains pending until the connected environment verifies migration, auth, permissions, audit, rendering and sign-off.
