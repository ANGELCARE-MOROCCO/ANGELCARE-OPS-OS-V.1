# ANGELCARE FLASHCARDS OS — UMZ1 TERMINAL RUNBOOK

## Apply code from the delivery ZIP

From the extracted delivery directory:

```bash
chmod +x APPLY_FLASHCARDS_OS_UMZ1.sh VERIFY_FLASHCARDS_OS_UMZ1.sh APPLY_DATABASE_UMZ1.sh
./APPLY_FLASHCARDS_OS_UMZ1.sh "$HOME/Desktop/angelcare-platform"
```

The installer accepts either:

- the monorepo root containing `apps/ops-web`, or
- the `apps/ops-web` directory itself.

It creates a timestamped backup for any colliding UMZ1 file, copies only the Flashcards OS patch, merges verification scripts into `package.json`, and runs static verification. It does not run a full application build.

## Apply the exact database migration

Set a PostgreSQL connection string in the shell without putting the password in the command history:

```bash
export FLASHCARDS_OS_DATABASE_URL='postgresql://...'
./APPLY_DATABASE_UMZ1.sh "$HOME/Desktop/angelcare-platform"
```

The database script executes only:

```text
supabase/migrations/20260731_flashcards_os_ultra_mega_zip1_foundation.sql
```

It does not push unrelated pending migrations.

## Verify again

```bash
./VERIFY_FLASHCARDS_OS_UMZ1.sh "$HOME/Desktop/angelcare-platform"
```

Inside `apps/ops-web`, the installer also adds:

```bash
npm run flashcards-os:umz1:verify
npm run flashcards-os:umz1:typecheck
npm run flashcards-os:umz1:typecheck:static
npm run flashcards-os:umz1:gate
```

The real typecheck requires the repository’s normal dependencies. The self-contained static typecheck remains available when `node_modules` is not present.

## Open the module

```text
http://localhost:3000/flashcards-os
```

A user must be authenticated and hold `flashcards_os.view`, `*`, or a privileged AngelCare role.

