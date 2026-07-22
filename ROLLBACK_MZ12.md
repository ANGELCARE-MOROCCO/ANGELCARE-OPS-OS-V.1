# Rollback MZ12

Application rollback restores every touched file from the timestamped installer backup and removes files introduced by MZ12. Database rollback uses `apps/ops-web/docs/revenue-command-os/phase-12/ROLLBACK.sql`, drops only MZ12 tables and restores the installation registry to MZ11.

Rollback does not alter MZ01–MZ11 business data.
