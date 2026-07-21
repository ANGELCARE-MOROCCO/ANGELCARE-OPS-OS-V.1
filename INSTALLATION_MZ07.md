# MZ07 Installation

```bash
bash "$HOME/Downloads/apply_revenue_os_mz07.sh" \
  "/Users/user/Desktop/angelcare-platform" \
  "$HOME/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ07_COMMANDS_1000.zip"
```

Apply the database migration manually with `psql`:

```sql
\set ON_ERROR_STOP on
\timing on
\i '/Users/user/Desktop/angelcare-platform/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase7_commands_1000.sql'
\i '/Users/user/Desktop/angelcare-platform/apps/ops-web/docs/revenue-command-os/phase-07/VERIFY.sql'
```

Or use the credential-free helper with `DATABASE_URL` supplied only in the local environment:

```bash
DATABASE_URL='postgresql://...' bash \
  "/Users/user/Desktop/angelcare-platform/tools/revenue-os/apply-phase7-migration.sh" \
  "/Users/user/Desktop/angelcare-platform"
```
