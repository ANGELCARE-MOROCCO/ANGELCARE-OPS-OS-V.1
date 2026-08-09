# Installation — Mega ZIP 4

1. Install and migrate MZ01, MZ02 and MZ03 first.
2. Run `apply_revenue_os_mz04.sh` against the monorepo root.
3. Apply `supabase/migrations/20260720_revenue_command_os_phase4_signal_fabric.sql` once in the same Supabase project.
4. Run `npm run revenue-os:phase4:verify` and `npm run revenue-os:phase4:typecheck`.
5. Start the web app and open `/revenue-command-os/signals`.
6. Keep `REVENUE_OS_EXECUTION_MODE=shadow` and `REVENUE_OS_ALLOW_EXTERNAL_ACTIONS=false`.

## Server environment

```env
REVENUE_OS_SIGNAL_SCAN_ENABLED=true
CRON_SECRET=<strong-random-server-secret>
REVENUE_OS_SIGNAL_WEBHOOK_SECRET=<different-strong-random-server-secret>
```

Both secrets are server-only. Never prefix them with `NEXT_PUBLIC_` and never store them in a command, doctrine, signal payload or database configuration row.

A scheduler may call `/api/revenue-command-os/signals/cron` with the bearer secret. The release does not silently change the existing Vercel cron schedule because deployment-plan limits vary; the route is ready for Vercel Cron, a private worker or another authenticated scheduler.
