# ANGELCARE Revenue Command OS — Trusted Operator Live Production

**Contract:** `AC-RCOS-TRUSTED-OPERATOR-LIVE-PRODUCTION-2026.08`  
**Source baseline:** `ANGELCARE_REVENUE_COMMAND_OS_FULL_SOURCE_20260806T022124Z.zip`  
**Baseline SHA-256:** `66a095238c35342c320a669045a0a7b93c6b73325a6be99740e979f90cf368da`

## Final operating doctrine

Every authenticated Revenue OS user is a trusted operator with full module authority. The active runtime is `live`. Legacy Shadow, approval, governance-hold and restricted-mode fields are accepted only when reading historical records and are normalized before runtime use.

The canonical execution chain is:

`Create/import → launch → execute → persist → result → audit → retry/recover`

## Implemented production closures

- One canonical runtime resolver returns `live` for every subsystem.
- Authenticated users receive full Revenue OS authority.
- Strategy generation, Council analysis, Studio decisions and compilation are non-blocking.
- Objective execution launches Strategy Assembly.
- Strategy execution compiles programs, missions, tasks and propagation packages.
- Programs, missions, tasks and exceptions expose direct live mutations.
- Imported commands are appended to the runtime library and become executable.
- Exact selected-command routing is enforced.
- Command rules, context gaps and doctrines are warnings rather than workflow blockers.
- Command schedules are live and operator-controlled.
- Worker dispatch verifies signatures, leases, ownership, idempotency, actor context and payload integrity.
- Pause, resume, cancel, suspend, restore, retry and compensation mutate authoritative state.
- WhatsApp is isolated to its own tenant-scoped channel state.
- Email Studio preserves Email OS and now records Revenue OS audit evidence.
- Calendar and direct Gmail retain the current disabled posture.
- Action Center loads server-persisted audit history rather than relying solely on browser memory.
- Exceptions support owner, action, retry, close, reopen and archive workflows.
- Settings expose direct capacity controls and a live-runtime enforcement action.
- Additive SQL converts active database postures to live and removes runtime approval gates.

## Verification included

- TypeScript/TSX syntax parser across the targeted source.
- 63 trusted-operator source assertions.
- Relative import and payload hash verification in the package lifecycle.
- Full-repository TypeScript and Next.js production build gate.
- Destination-adapter contract presence gate against the full AngelCare repository.
- SQL preflight, migration, post-migration verification and rollback.

## Change boundary

- Revenue Command OS source only, plus the existing AI Provider Control governor used by Revenue OS.
- No unrelated page redesign.
- Existing mature drawers and specialist workspaces remain mounted.
- SQL is included but never executed by the installer.
