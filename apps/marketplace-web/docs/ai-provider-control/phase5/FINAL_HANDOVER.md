# Final Handover — Revenue OS × AI Provider Control

## Deployment state after source application

The source becomes a production candidate for AI sovereignty, but Phase 5 runtime tables and functions do not exist until the additive SQL migration is approved and run manually.

## Required order

1. Apply the signed source ZIP.
2. Run the included final source/TypeScript/build gate.
3. Run `DIAGNOSTIC.sql` in Supabase.
4. Apply the Phase 5 migration manually.
5. Run `VERIFY.sql` and confirm all required objects and seed policies exist.
6. Deploy the exact verified repository state once.
7. Run the live acceptance journeys below.

## Live acceptance journeys

- Launch one Strategy Assembly request and verify `EXECUTE_NEW` plus reconciled usage.
- Repeat the equivalent request and verify `REUSE_CACHED` or `JOIN_IN_FLIGHT` without a second provider call.
- Reach a command or module limit and verify the provider is not called.
- Run an active health test once, then verify the fresh result is reused.
- Launch Council review and confirm each specialist request is centrally attributed.
- Refresh the executive cockpit and confirm a valid brief is reused while facts remain unchanged.
- Review Revenue AI usage, schedules, blocked requests and avoided cost in `/ai-provider-control`.

## Preserved operating boundaries

- No Revenue workspace is replaced.
- Existing drawers, modals, actions and commercial workflows remain under Revenue OS.
- External actions remain approval-gated.
- Direct Gmail remains disabled.
- WhatsApp remains manually controlled.
- Calendar remains disabled.
- No provider secret is exposed to Revenue users or clients.

## Rollback

The source package has an exact guarded rollback. Database rollback is a separate destructive, explicitly manual SQL file and must not be run without exporting Phase 5 data and approving the reversal.
