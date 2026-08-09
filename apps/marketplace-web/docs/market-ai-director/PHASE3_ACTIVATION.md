# Marketing Operations Autopilot Phase 3 Activation

## User journey smoke test

1. Open `/market-os/content-command-center/ai-director/missions` and confirm an approved mission exists.
2. Open `/market-os/content-command-center/ai-director/compiler` and compile that mission.
3. Review every proposed item and approve or reject the compilation.
4. Put the approved compilation into the queue.
5. Trigger one authorized cron cycle or use the normal scheduler.
6. Open `/market-os/content-command-center/ai-director/queue` and verify jobs move through queued → running → completed.
7. Open `/market-os/content-command-center/ai-director/integrations` and confirm canonical records and provenance links.
8. Explicitly import one record into the existing Content Command browser workflow.
9. Confirm it appears in Briefs, Portfolio, Tasks or Assets according to its type.
10. Verify no email, WhatsApp, post or external action was executed.

## Native Vercel Cron

Merge the supplied example cron entry into the existing `vercel.json` rather than replacing that file. Set Vercel `CRON_SECRET` to the same value already used by `MARKETING_AI_CRON_SECRET`, then create a new deployment.
