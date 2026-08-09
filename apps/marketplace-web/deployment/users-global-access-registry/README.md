# ANGELCARE Users Management — Global Access Registry Scanner

This delivery upgrades the Users Management access scanner from a protected-module-only catalogue into a global application-resource registry.

## Resource hierarchy

- Formal modules
- Module workspaces
- Independent route families
- Independent nested groups
- Standalone pages
- Page routes
- Dynamic routes
- API routes
- Internal or excluded surfaces

## Core operating behavior

1. **Dry scan** inspects the complete `apps/ops-web/app` tree and writes only a preview/audit record.
2. **Classification Studio** allows an authorized actor to review type, name, assignability, dashboard visibility, and navigation visibility.
3. **Publish** reconciles the canonical registry, preserves existing user grants, marks missing resources instead of deleting them, and creates a recoverable registry version.
4. **Permission assignment** exposes modules, families, groups, standalone pages, and individual routes through the existing Users Management permission workflow.
5. **Dashboard resolution** renders authorized independent families and standalone pages beside the existing module workspace.
6. **Recovery** restores a selected registry snapshot as a new active version and preserves immutable audit history.

## Security doctrine

- Authenticated actor required.
- Active governance-management permission required for scan publication and rollback.
- Server-side Supabase service role required for registry mutations.
- Browser clients receive read-only registry RLS.
- Discovery never grants access automatically.
- Existing `app_users.permissions` remains compatible.
- Family and group permissions inherit to their child page routes.
- Missing filesystem routes are never automatically deleted.

## Verification

Run from `apps/ops-web`:

```bash
node deployment/users-global-access-registry/verify-global-access-registry.mjs
```

This performs static TypeScript verification and runtime scanner invariants only. It does not run a Next.js build or execute SQL.
