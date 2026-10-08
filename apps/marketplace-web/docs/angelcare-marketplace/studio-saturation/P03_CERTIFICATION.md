# P03 — Universal Action Registry — Certification

P03 converts Studio CTA destinations from raw-link-first authoring into governed structured action references.

## Certified scope

- 14/14 P00 action candidates registered and mapped.
- P02 Universal Picker reused for canonical action targets.
- Structured action references are native Puck fields for primary, secondary and nested-item actions.
- Existing Marketplace business engines and existing admin workspaces remain authoritative.
- Public runtime resolves structured actions server-side to approved existing Marketplace routes.
- Unknown actions, unsupported target sources, missing/unpublished targets and unsafe external schemes fail closed.
- `inquiry.submit` is recognized but intentionally resolves as `WORKFLOW_REQUIRED` until P07 wires the canonical form/submission workflow; no fake inquiry engine is introduced.
- Existing legacy `href` fields remain readable for backward compatibility but are no longer the preferred authoring path.
- Developer Contract exports the live action registry in TXT/CSV/JSON.

## Targeted certification

- P01 regression: PASS.
- P02 regression: PASS.
- Studio invariants: 37/37 PASS.
- Visual catalogue: 10/10 categories, 100/100 experiences PASS.
- Targeted TypeScript transpilation: 20 touched TS/TSX files PASS.
- P03 targeted verifier: PASS.
- Fresh certified P02 baseline apply: PASS.
- Package file hash verification: PASS.
- ZIP integrity: PASS.

## Safety

`SQL=NO`
`MIGRATION=NO`
`DATABASE_CHANGE=NO`
`NEW_ADMIN_WORKSPACE=NO`
`LOCAL_BUILD=NO`
`GLOBAL_TYPESCRIPT=NO`
`P04_TEMPLATE_ASSIGNMENT=NO`
`COMMIT=NO`
`PUSH=NO`
`DEPLOY=NO`
