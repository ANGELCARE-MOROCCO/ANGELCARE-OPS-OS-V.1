# SOCIAL COMMAND MZ6 — IMPLEMENTATION REPORT

MZ6 is the merged execution of the signed premium UIX standby contract and Engagement Intelligence completion contract.

## Production defects closed in source
1. DM replies no longer use the Facebook Page-token messaging path. MZ6 uses the dedicated Instagram Login credential, Instagram Professional Account ID, `graph.instagram.com`, the recipient Instagram-scoped ID, and provider confirmation before recording `sent`.
2. DM sender identity can be resolved from the Instagram-scoped sender ID using the provider profile surface and is cached with bounded refresh. Failed/limited enrichment remains explicitly limited rather than fabricated.
3. Comment cards are full interaction surfaces and open a deep premium command drawer.
4. Drawers are rendered through a portal and measure the live horizontal navigation's viewport bottom; they therefore begin below the overhead Social Command shell instead of covering it.
5. Engage gains purpose-specific operational atmospheres for inbox/DM, priority, commercial, sensitive, SLA, assignment, waiting and resolved modes.
6. Comment lanes gain operational headers, meaningful empty states, semantic tags, provider/test distinction, deep origin/operation/reply context and assignment/priority/sensitive/resolve controls.
7. The global horizontal menu is upgraded into a premium command-mode strip with semantic sigils, descriptions, counts where real and controlled mode coloration.
8. Copy Vault and AI Draft remain governed tools; manual text remains available.

## Data truth
No identity field is synthesized. Profile data is persisted only from provider evidence. Comment-only users are not assumed to have profile-consent eligibility. Missing provider context is rendered as missing/limited.

## Security
Tokens remain server-side. No secret is shipped in the source package. The new contact profile table has RLS enabled and direct `anon`/`authenticated` access revoked.

## Verification performed while packaging
- MZ6 source sovereignty gates: PASS 70/70
- TS/TSX syntax transpilation: PASS 4/4, zero syntax diagnostics
- reconstructed cumulative MZ3.1 + MZ4 + MZ5 precondition patch simulation: PASS
- full Next.js build: NOT RUN
- SQL: NOT RUN
- Meta mutation: NOT RUN
