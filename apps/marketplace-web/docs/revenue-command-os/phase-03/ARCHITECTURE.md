# Architecture

## Runtime layers

1. **Contract seeds** provide safe fallback data when MZ03 tables are unavailable.
2. **Server-only repository** reads and mutates authorized records through Supabase.
3. **Lifecycle validator** enforces status transitions and doctrine readiness.
4. **Governance API** allow-lists doctrine mutation, approval, conflict, indexing and validation actions.
5. **Knowledge studio** provides purpose-built executive and operator experiences.
6. **Search bridge** adds doctrines, assets, playbooks and conflicts to Revenue OS global search.
7. **Audit/version layer** records all governed mutations and immutable snapshots.

## Truth precedence

An effective doctrine with current dates, validated authority and no unresolved critical conflict outranks approved, in-review, draft, suspended, retired or unsupported resources. Conflicting effective resources are blocked until a traceable resolution is recorded.

## Safety posture

MZ03 remains in Shadow mode. Index jobs are queued locally for a future controlled semantic retrieval layer; they do not call an external model in this phase.
