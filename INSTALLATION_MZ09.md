# Installation — MZ09

```bash
bash "$HOME/Downloads/apply_revenue_os_mz09.sh" \
  "/Users/user/Desktop/angelcare-platform" \
  "$HOME/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ09_COMMANDS_3000.zip"
```

Apply the database migration only after the application installer passes:

```bash
DATABASE_URL='YOUR_SESSION_POOLER_URL' \
  bash "/Users/user/Desktop/angelcare-platform/tools/revenue-os/apply-phase9-migration.sh" \
  "/Users/user/Desktop/angelcare-platform"
```

No Git stage, commit, automatic migration or production build is performed by the application installer.
