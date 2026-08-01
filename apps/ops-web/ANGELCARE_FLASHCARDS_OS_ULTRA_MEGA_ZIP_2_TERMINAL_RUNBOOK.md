# ANGELCARE Flashcards OS — Ultra Mega ZIP 2 Terminal Runbook

## 1. Extract

```bash
cd ~/Downloads
unzip ANGELCARE_FLASHCARDS_OS_ULTRA_MEGA_ZIP_2_20260731.zip
cd ANGELCARE_FLASHCARDS_OS_ULTRA_MEGA_ZIP_2_20260731
```

## 2. Make scripts executable

```bash
chmod +x \
  APPLY_FLASHCARDS_OS_UMZ2.sh \
  APPLY_DATABASE_UMZ2.sh \
  VERIFY_FLASHCARDS_OS_UMZ2.sh
```

## 3. Apply application patch

Pass either the monorepo root or `apps/ops-web`:

```bash
./APPLY_FLASHCARDS_OS_UMZ2.sh \
  "$HOME/Desktop/angelcare-platform"
```

The installer:

- validates that Ultra Mega ZIP 1 is present;
- creates a timestamped backup under `.flashcards-os-backups/`;
- copies only the bounded Ultra Mega ZIP 2 payload;
- merges controlled verification commands into `package.json`;
- runs deterministic UMZ2 verification;
- never runs a full Next.js build;
- never applies the database migration automatically.

## 4. Configure server-only environment values

Review:

```text
apps/ops-web/.env.flashcards-os.example
```

Copy required values into your existing secure server environment or local `.env.local`. Never prefix them with `NEXT_PUBLIC_`.

Minimum live provider keys:

```text
TAVILY_API_KEY=...
OPENROUTER_API_KEY=...
```

For an external worker calling the protected process endpoint:

```text
FLASHCARDS_OS_INTELLIGENCE_WORKER_SECRET=...
```

## 5. Apply the exact UMZ2 database migration

```bash
export FLASHCARDS_OS_DATABASE_URL='postgresql://...'

./APPLY_DATABASE_UMZ2.sh \
  "$HOME/Desktop/angelcare-platform"
```

The runner applies only:

```text
20260731_flashcards_os_ultra_mega_zip2_intelligence.sql
```

## 6. Verify

```bash
./VERIFY_FLASHCARDS_OS_UMZ2.sh \
  "$HOME/Desktop/angelcare-platform"
```

## 7. Start the existing application normally

Use the repository’s existing normal start procedure. The UMZ2 delivery does not replace it.

Open:

```text
http://localhost:3000/flashcards-os/intelligence
```

## 8. Backups

Application backups are created under:

```text
apps/ops-web/.flashcards-os-backups/umz2-YYYYMMDD-HHMMSS/
```

No database rollback is run automatically. Use your database backup policy before applying production migrations.
