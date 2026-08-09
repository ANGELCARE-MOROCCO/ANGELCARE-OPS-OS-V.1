# ANGELCARE Global Authorization Intelligence & Reconciliation Command

This upgrade extends the existing **Global Access Registry & Route-Family Scanner**. It does not create a competing registry and does not contain business-module adapters.

## Product mission

The command reconstructs authorization from repository and database evidence, stores a versioned topology, compares global route/module assignments with native authority, generates fail-closed correction plans, and executes only administrator-confirmed authority contracts.

It understands evidence for:

- authentication and authorization helpers;
- direct permissions and permission arrays;
- RBAC and role-permission junctions;
- memberships, tenants, organizations, and workspaces;
- entitlements, feature flags, ownership, ACLs, and RLS;
- grant/cache versions, revocation, audit, and recovery authority.

Unknown or contradictory authority remains quarantined and non-executable.

## User experience

The original quick scanner remains available. It links to the full studio at:

```text
/users/access-governance
```

The studio contains exactly six master workspaces:

1. Scan Overview
2. Classification Studio
3. Families & Groups
4. Pages & APIs
5. Reconciliation
6. Publication & Recovery

## Safety model

- Discovery never grants or revokes access.
- Generated manifests are non-executable.
- An administrator must review evidence and register existing mutation and verification RPCs.
- RPC identifiers are validated and must be declared in a confirmed authority manifest.
- Plans are dry-run simulations until sovereign approval.
- Execution is transactional and verifies effective access.
- Cache epochs, checkpoints, verification evidence, audit events, and rollback packages are persisted.
- Unsupported models fail closed.

## Runtime isolation

The scanner filesystem boundary is server-only. It uses explicit root containment, `turbopackIgnore` markers, persisted directory inventory work, bounded source-analysis chunks, pause/resume/cancel controls, and stored snapshots. Normal page navigation does not initiate a repository scan.

The optional variable below may point the scanner at the application root. When omitted, the server process working directory is used:

```text
ANGELCARE_SCANNER_SOURCE_ROOT=/absolute/path/to/apps/ops-web
```

Never point it to `/` or an uncontrolled parent filesystem.

## Validation commands

From `apps/ops-web`:

```bash
npm run access-governance:command:verify
npm run access-governance:command:typecheck
```

Neither command runs a production build.
