# Mega ZIP 7 Rollback

## Runtime rollback

1. Activate a scoped kill switch if behavior is unsafe.
2. Mark version `0.7.0` known bad when appropriate.
3. Move the pilot or stable channel to `0.6.0`.
4. Confirm devices receive the rollback channel and commands remain governed.
5. Preserve incident evidence and audit history.

## Database rollback

Run only when the Mega ZIP 7 production schema itself must be removed:

`apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_production_final.sql`

The rollback removes Mega ZIP 7 production-control structures and returns release channels to accepted version `0.6.0`. It does not remove Mega ZIPs 1–6 commercial data.

## Source rollback

Use the pre-injection backup created by `MEGA7_TERMINAL_INJECTION.md`. Restore overwritten files and remove files listed under `FILES_NOT_PRESENT_BEFORE.txt`.
