# Rollback — MZ09

Application rollback uses the timestamped backup produced by the installer:

```bash
bash "/Users/user/Desktop/angelcare-platform/rollback_revenue_os_mz09_application.sh" \
  "/Users/user/Desktop/angelcare-platform" \
  "/Users/user/Desktop/angelcare-platform/backups/revenue-command-os/mz09-<timestamp>"
```

Database rollback is manual:

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f "/Users/user/Desktop/angelcare-platform/apps/ops-web/docs/revenue-command-os/phase-09/ROLLBACK.sql"
```
