# Deployment Order

## 1. Preserve the current state

- Create a repository backup or Git checkpoint.
- Export the existing access-governance tables before database migration.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` and the Supabase URL are configured only on the server.

## 2. Inject the application overlay

Use the package-level `APPLY_OVERLAY.sh`. The installer validates the synchronized source baseline, backs up every affected file, copies the scoped payload, verifies SHA-256 hashes, and runs the static verifier.

The installer does **not** run a production build and does **not** execute SQL.

## 3. Apply database migration manually

Apply after reviewing and backing up:

```text
apps/ops-web/supabase/migrations/20260721_users_global_access_registry_route_family_scanner.sql
```

This migration is additive. It creates the canonical resource hierarchy, registry versions, normalized resource grants, compatibility columns, indexes, immutable audit controls, and read-only authenticated RLS.

## 4. Deploy the application

Deploy through the normal AngelCare production process after the migration is accepted.

## 5. Initialize the registry

From Users Management:

1. Open **Global Registry Scanner**.
2. Run a **Global Dry Scan**.
3. Review unprotected mounts, independent families, standalone pages, dynamic routes, and unverified API guards.
4. Adjust classifications and visibility rules where required.
5. Confirm publication.
6. Publish the reviewed registry version.

No discovered resource is granted to any user automatically.

## 6. Assign and validate access

- Assign a complete module, independent family, nested group, standalone page, or individual route to a test user.
- Confirm the user sees the authorized card on the dashboard.
- Confirm family/group permission inheritance exposes the expected child routes.
- Confirm an unauthorized route remains absent from the route catalogue and dashboard.
- Confirm direct API authorization remains enforced independently by each API handler.

## 7. Production acceptance

Record:

- Registry version number
- Scan checksum
- Resources/modules/families/routes detected
- Unverified API guard count
- Publishing actor
- Access test users and expected permissions
