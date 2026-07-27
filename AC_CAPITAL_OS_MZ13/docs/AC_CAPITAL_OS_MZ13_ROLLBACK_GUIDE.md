# AC CAPITAL OS MZ13 — Rollback Guide

This ZIP copies files only. It does not run SQL automatically.

Rollback options:

1. Restore from `.angelcare_backups` if created by your own Git workflow.
2. Re-apply the previous accepted MZ12 ZIP.
3. Remove MZ13 migration file if SQL was not executed.
4. If SQL was executed, do not drop tables casually. Disable feature flags and leave tables dormant unless a controlled DB rollback is approved.

Never remove audit or production wiring records without approval.
