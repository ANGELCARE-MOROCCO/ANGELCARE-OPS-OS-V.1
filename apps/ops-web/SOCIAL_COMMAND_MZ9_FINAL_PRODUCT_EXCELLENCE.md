# AngelCare Social Command MZ9
## Final Product Excellence / Operator Experience Closure

MZ9 closes Social Command as a professional operator product layer on top of the already working Meta, publishing, engagement, Copy Vault, Media Vault, DAM and MZ8 lifecycle foundation.

## Delivered experience upgrades

- Universal operator command surface through the existing Social Command shell.
- `/` and `⌘K / Ctrl+K` command palette access.
- Command palette now searches publications, campaigns, media assets, conversations and fixed command actions.
- Saved Views: personal/shared operator views for COMMAND, STUDIO, PUBLISH, ENGAGE, AUTOMATE and CONTROL.
- Execution Control Room replaces ambiguous publishing queues with exact operator language.
- `Run` semantics are replaced by `Execute now` with explicit ahead-of-schedule confirmation.
- Execution Job Dossier with provider truth, attempts, provider results, media, error evidence and status explanations.
- Provider processing is separated from failure: Instagram container readiness appears as `META PROCESSING`, not frightening generic failure.
- Drawer surfaces are designed to open below the command header.
- Empty states, status semantics and failure copy are upgraded to production operator language.

## Delivered reliability upgrades

- Publishing has an irreversible provider-success boundary.
- Once Meta confirms publication, internal finalization warnings never authorize another blind provider resend.
- Provider results are persisted first, then canonical job state is finalized.
- Stale worker-lock recovery inspects `social_command_provider_results` before moving stale jobs back to retry.
- Attempt ledger and publication reconciliation failures are warnings after provider success, not automatic resend triggers.
- Supabase write errors are explicitly checked in key publishing finalization paths.
- Instagram image publishing now treats media-container lifecycle as asynchronous.
- Instagram carousel children are staged and verified before parent publication.
- Transient Instagram container/provider errors are classified into controlled confirming instead of premature failure.

## Delivered persistence additions

- `social_command_saved_views`
- `social_command_operator_preferences`

These tables are additive, service-controlled and do not mutate Meta, media binaries, relationship evidence, or existing publishing data.

## Protected boundaries

- No Marketplace source.
- No `.env` or secrets.
- No Meta mutation by installer.
- No SQL execution by installer.
- No full Next.js build by installer.
- Relationship evidence remains durable: DMs/comments/webhooks are resolved/archived, not casually destroyed.

## Acceptance position

MZ9 is a summit operator-experience closure. It is not a new business module. It upgrades the daily use of the existing Social Command estate so operators understand what is happening, what is safe, what requires attention, and what must not be manually resent.
