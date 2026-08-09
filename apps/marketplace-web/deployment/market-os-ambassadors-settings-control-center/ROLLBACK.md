# Rollback

## Preferred production rollback

When a settings version has already been published, use **Restore version** inside the Settings Control Center. This publishes a new actor-backed rollback version and preserves the complete approval and audit history.

## Code rollback

Apply the included reverse Git patch or restore the pre-injection file backup. Re-run static verification after restoration.

## Database teardown

The destructive teardown file is:

`database/market-os-ambassadors/20260721_market_os_ambassador_settings_control_center.rollback.sql`

It is intentionally guarded and refuses to run while any Settings version remains `published` or `scheduled`. Export the five Settings control tables first. The teardown removes only the additive Settings-control tables, functions, triggers, idempotency results and permissions; it does not delete the legacy `market_os_ambassador_settings` record.
