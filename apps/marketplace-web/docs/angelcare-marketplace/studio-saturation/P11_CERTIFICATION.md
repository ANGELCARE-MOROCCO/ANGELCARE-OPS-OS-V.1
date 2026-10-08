# P11 — Permissions / Governance / Fail-Closed — Certification

- Policy families: **12**
- Enforcement modes: **5** (`draft`, `preview`, `publish`, `template_assignment`, `public_runtime`)
- Decisions: **ALLOW / BLOCK / FALLBACK**
- Existing RBAC authority preserved.
- Experience Core lifecycle remains publication authority.
- Denied preview/publish/assignment decisions use the existing Marketplace audit ledger.
- Drafting remains permissive for incomplete work but policy-critical malformed metadata is rejected.
- Public runtime never executes a policy-blocked Studio template; it falls back to Category-Native.
- No P11 table, migration, shadow policy store or new admin workspace.
- No local production build and no global TypeScript sweep.
