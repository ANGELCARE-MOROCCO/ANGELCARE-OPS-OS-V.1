# Rollback

## Application rollback

Remove the added Revenue OS route, API and library files, then revert the four navigation/permission registry changes listed in `FILE_CHANGE_MANIFEST.md`.

## Database rollback

Run `ROLLBACK.sql` only when Revenue OS Phase 1 data can be destroyed. The script removes only `revenue_os_*` objects and does not touch the existing Revenue Command Center.

## Safety

The audit append-only trigger must be dropped before the audit table can be removed. The supplied rollback script handles this order.
