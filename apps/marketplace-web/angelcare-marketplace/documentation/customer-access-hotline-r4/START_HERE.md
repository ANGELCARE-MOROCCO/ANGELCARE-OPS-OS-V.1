# Customer Access + Hotline R4 — surgical corrective patch

## Observed deployment evidence
During this investigation the deployed GET `/api/angelcare-marketplace/customer/auth/social/providers` returned HTTP 200 with all three providers false, `profileReady:true`, `settingsAvailable:true` (request `e5262175-37b4-4ec8-8df7-497bdf7ded9e`, about 10 seconds). This means the application's Auth target did not advertise any social provider as enabled at that time. It does not prove a Google credential failure or a missing social migration.
The deployed email-worker endpoint returned HTTP 401 to an unauthenticated GET. That verifies the endpoint exists and is protected; it does not verify its environment, scheduler, ledger, SMTP credentials or inbox delivery.
The screenshot's literal `signal is aborted without reason` is consistent with an aborted request. The original client aborted all GET requests at 12 seconds and propagated raw aborts; the Studio treated its three reads as an all-or-nothing operation and still displayed a default route as ready when none had loaded. No server trace of this particular failed request was available.
The 2026-10-11 runtime capture located Auth in Windows WSL Ubuntu (`supabase-auth`, GoTrue v2.189.0); its then-current Send Email Hook was absent. Current placement and flags must be re-read before changing them. Adding GoTrue variables only to the Marketplace application cannot configure this separate Auth container.

## Installed changes
- Original Google multi-colour, Facebook blue and Apple black marks, served locally; original provider artwork, no substitute letter icons.
- Equal social-button hierarchy, availability text, retry checking, explicit provider-unavailable feedback in FR/EN/AR. A disabled provider cannot start OAuth, but its informational button no longer silently blocks the customer. Checking and in-progress mutations still disable actions.
- Apple keeps the previously requested update dialog and its manual/ten-second close. Facebook's cancellation is respected; this installer does not enable Meta or change any App ID/secret.
- Native Google/Facebook start/callback, customer mandatory profile, permissions, existing email/password and atomic journeys remain in place. Readiness database and Auth reads receive bounded timeouts.
- Hotline request timeout messages are understandable; owner cancellation remains suppressible; no automatic retries of mutations. Read timeout 30 seconds, mutation timeout 60 seconds, preserving native URLs, cookies and payloads.
- Studio waits for real configuration and audio before showing editable routes. Partial permission-read failure cannot enable publication. Manual read recovery retains an unsaved draft and original revision.
- New visible `Musique d’attente` tab: MP3 upload uses shared `all` locale and `music` purpose, no voice transcript; native S: gateway validation remains authoritative. A ready MP3 can be listened to and assigned to the draft explicitly. Save and publication stay separate; existing calls stay pinned to their version.
- The original delivered instrumental is available at `bridge/hotline-worker/audio/angelcare-care-celesta.mp3`. It is not automatically uploaded to S: or published.
- Protected email status additionally reports actual deployed environment-presence flags, never secrets, recipients, token URLs or email bodies. Composition, mailbox resolution, Menara transport, hook SQL and sender credentials are unchanged.

## Installation / diagnosis / release are separate
Install with `node install.mjs /Users/user/Desktop/angelcare-platform` from the extracted package. The installer preflights all merges, backs up actual files, refuses ambiguous conflicts, verifies hashes and prints rollback. No SQL, dependencies, local build, global TypeScript, Git, remote writes, environment changes, SMTP tests or email sends.

Read-only diagnostic from the Mac after installation:

```bash
node "$HOME/Desktop/angelcare-platform/apps/marketplace-web/scripts/customer-access-repair/diagnose.mjs" "$HOME/Desktop/angelcare-platform"
```

The diagnostic reads the deployed provider endpoint, authenticated email status when an existing local worker secret can be found, candidate DB status with an existing local service key, and the previously documented Windows/WSL runtime via the existing SSH configuration. It saves owner-only reports in Downloads. Local environment values are candidate configuration until matched to the authenticated deployed worker's Auth origin. An unavailable secret, network, SSH host or ledger read is reported rather than passed. No recipient, credential value, OTP/token-bearing link or email body is written to the report. No email is sent.

Interpretation:
- `GOOGLE_DISABLED_BY_DEPLOYED_AUTH`: configure the real Auth service with Google ENABLED, CLIENT_ID, SECRET and its exact REDIRECT_URI, not the Marketplace app alone.
- `AUTH_SEND_EMAIL_HOOK_NOT_ENABLED...`: source + SQL deployment did not activate the hook. Existing legacy SMTP is still the delivery path. Confirm the worker is deployed and running before enabling the native hook.
- `queued`/`retry_wait`: review running worker and error codes; do not declare delivered.
- `provider_accepted`: SMTP acceptance only; verify the recipient's inbox and link separately.
- `failed`: use the recorded native error code to repair the actual mailbox/bridge/transport; do not change STARTTLS or mailbox passwords speculatively.
- `delivery_unknown`: uncertain acknowledgement; review before any resend.

After the runtime report, activate only the needed existing authorities, with separate backups and source-specific commands. This package contains no blind Windows/Auth repair and does not claim emails or OAuth were made operational.

Release the source through the canonical Marketplace workflow, deploy its exact commit image via Coolify, then verify Google login/register with a real customer, compulsory profile and existing customer return. Verify one signup/resend and recovery inbox/link, plus the shared OPS email path. Test music upload, seek/playback, save/publish and actual waiting playback. The source checks are not those live acceptance checks.
