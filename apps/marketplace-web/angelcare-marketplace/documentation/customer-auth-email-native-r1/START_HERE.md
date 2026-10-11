# AngelCare Auth Email Native R1 — repo patch

This package adds a durable Supabase Auth email hook and a protected worker that uses the existing Email OS mailbox resolver and Windows send bridge. It installs source only. It does not activate the hook, start the worker, run SQL, send email, alter credentials, or modify Windows.

## 1. Install source only

```bash
node "$HOME/Downloads/ANGELCARE_AUTH_EMAIL_NATIVE_R1_20261011/install.mjs" "$HOME/Desktop/angelcare-platform"
```

All package paths are new. Existing files with different contents are preserved and installation stops before writing. Repeat installation is supported. The installer prints the exact rollback command and preserves later edits during rollback. No dependencies, full TypeScript check, build, Git operation or deployment runs.

## 2. Separate release and activation

Commit/push the source and build/deploy the Marketplace image through the existing release process. Before switching Auth delivery, separately apply `apps/marketplace-web/database/marketplace-auth-email-native-r1.sql` in the Supabase SQL editor. This SQL creates its own ledger/functions; it does not change Auth users or Email OS credentials. SQL execution has not been verified against your production database.

The Marketplace runtime needs these additional settings:

```dotenv
ANGELCARE_AUTH_EMAIL_WORKER_SECRET=<one server-only random secret of at least 32 characters>
ANGELCARE_AUTH_EMAIL_MARKETPLACE_ORIGIN=https://my.angelcarehub.com
```

Reuse the existing `NEXT_PUBLIC_SUPABASE_URL`, service-role configuration consumed by `createServiceClient`, `EMAIL_OS_BRIDGE_URL`, and `EMAIL_OS_BRIDGE_TOKEN`. Never invent or replace these values. Optional `ANGELCARE_AUTH_EMAIL_REDIRECT_ORIGINS` is a comma-separated list of additional HTTPS origins; existing Marketplace, OPS, localhost:3000 and the established project preview domain family are supported.

The separately deployed scheduler runs `scripts/customer-auth-email/run-worker.mjs` with:

```dotenv
ANGELCARE_AUTH_EMAIL_WORKER_URL=https://my.angelcarehub.com
ANGELCARE_AUTH_EMAIL_WORKER_SECRET=<the identical Marketplace secret>
```

No scheduler/service registration is performed by this package. Its Windows setup is a separate stage. Establish the deployed endpoint, ledger and running scheduler first; only then enable the Supabase Auth Send Email Hook with these settings passed into the actual Auth container:

```dotenv
GOTRUE_HOOK_SEND_EMAIL_ENABLED=true
GOTRUE_HOOK_SEND_EMAIL_URI=pg-functions://postgres/public/angelcare_marketplace_auth_email_hook
```

The PostgreSQL hook does not need an HTTP webhook secret. Keep email authentication enabled and automatic confirmation disabled. Hook activation replaces SMTP delivery for this Supabase Auth instance globally. Marketplace callbacks/customer metadata select `supports@angelcarehub.ma`; existing OPS and preview destinations select the established `it.support@angelcarehub.ma`. Both native mailboxes and their provider/credential records must be active before activation. No CEO PIN is used or stored.

Do not enable this hook without its worker: signup may record a queued event but no email will be delivered. Disabling the hook restores the configured legacy SMTP path; it does not repair that path's rejected credentials. Keep the ledger until any in-flight work has been reviewed. Source rollback alone does not disable the Auth hook.

## 3. Separate live acceptance

Test one real signup/resend and one password recovery after activation. Observe the received message, open its real link, finish verification/reset, and sign in to the customer portal. Also check an existing OPS Auth flow because the hook is instance-wide. `provider_accepted` means the provider accepted the recipient; it is not proof of inbox arrival. This package cannot guarantee receipt before those tests.

The worker records known 535/transient failures for bounded retries; an uncertain acknowledgement is held as `delivery_unknown` instead of automatically sending a duplicate. Jobs have a 15-minute operational delivery window (not a promise about the Auth token lifetime). Delivered/unknown payloads are cleared. Status responses contain no recipient addresses or token-bearing links.

## Included offline verification

Pure email composition, destination validation, locale/RTL, error classification, mock worker behaviour and installer safety are checked offline. No production email has been sent. The offline test is optional and separate from installation:

```bash
node "$HOME/Downloads/ANGELCARE_AUTH_EMAIL_NATIVE_R1_20261011/payload/apps/marketplace-web/scripts/customer-auth-email/offline-checks.mjs"
```

Official contracts: [Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), [Self-hosted Auth hooks](https://supabase.com/docs/guides/self-hosting/auth-hooks).
