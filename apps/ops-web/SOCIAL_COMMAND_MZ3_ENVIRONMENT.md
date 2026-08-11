# Social Command MZ3 · Environment Contract

MZ3 adds hardening variables without removing the existing MZ1/MZ2 environment contract. No secret values belong in source control.

## Immediate webhook signing hardening

Preferred dedicated variable:

- `SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRET` — the app secret that actually signs the Meta webhook surface in use. In the current Meta console this may be the Instagram App Secret exposed on the webhook setup surface. Keep the existing `META_APP_SECRET` unchanged; MZ3 can test multiple candidates.

Optional aliases / rotation inputs:

- `SOCIAL_COMMAND_INSTAGRAM_APP_SECRET`
- `INSTAGRAM_APP_SECRET`
- `SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRETS` — comma/semicolon/newline list or JSON array of additional signing secrets during rotation.

MZ3 never logs or returns secret values. Health output exposes source labels/fingerprints only. Strict HMAC validation remains mandatory.

## Webhook subscription reconciliation

- `SOCIAL_COMMAND_META_WEBHOOK_FIELDS` — optional override. Default desired set: `comments,live_comments,messages,messaging_postbacks,messaging_seen,mentions`.
- `SOCIAL_COMMAND_META_SUBSCRIPTION_HOST` or `SOCIAL_COMMAND_META_SUBSCRIPTION_HOSTS` — optional override. Defaults attempt Graph Facebook then Graph Instagram.
- `SOCIAL_COMMAND_AUTO_RECONCILE_WEBHOOK_SUBSCRIPTIONS=true` — optional. When enabled, successful Meta authorization and credential-health automation attempt subscription reconciliation automatically. Keep disabled until the first manual inspect/reconcile is confirmed in production.

## RBAC

- `SOCIAL_COMMAND_RBAC_ENFORCE=true` — enables Social Command route-level permission enforcement. Default is OFF to preserve current behavior during rollout.
- `SOCIAL_COMMAND_PRIVILEGED_ROLES` — additional privileged role names.
- `SOCIAL_COMMAND_OPERATOR_ROLES` — additional operator role names.
- `SOCIAL_COMMAND_VIEWER_ROLES` — additional viewer role names.

Do not enable enforcement until production user roles have been compared with the Control → Security health output.

## Encryption key rotation

Existing:
- `SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY` — current write key.

New optional read-only previous-key ring:
- `SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEYS_PREVIOUS` — JSON array or comma/semicolon/newline list of previous keys.
- `SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY_PREVIOUS` — compatibility alias.

New writes use versioned `v2` AES-256-GCM envelopes with a non-secret key identifier. Existing `v1` records remain readable. The `control/crypto-rotate` operation rewrites stored Meta/OAuth credentials using the current key.

## Windows media hardening

- `SOCIAL_COMMAND_MEDIA_MIN_FREE_BYTES` — optional, default 10 GiB.
- `SOCIAL_COMMAND_MEDIA_TEMP_RETENTION_HOURS` — optional, default 24 hours.

The publisher scheduler continues to require Machine variables:
- `SOCIAL_COMMAND_WORKER_TICK_URL`
- `SOCIAL_COMMAND_WORKER_SECRET`

MZ3 removes the worker secret from the generated `tick.ps1` file; the scheduled runner reads it from Machine environment on every execution.
