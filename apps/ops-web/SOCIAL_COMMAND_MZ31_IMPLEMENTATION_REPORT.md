# ANGELCARE SOCIAL COMMAND — MZ3.1 IMPLEMENTATION REPORT

MZ3.1 activates a dedicated Instagram Login credential path for account-level webhook subscriptions without replacing the existing Facebook Login for Business publishing connection.

Implemented source:
- `lib/social-command/instagram-webhook.ts`
- `app/api/social-command/instagram-webhook/subscriptions/route.ts`
- `app/(protected)/social-command/_components/WebhookCommandMZ31.tsx`
- `app/(protected)/social-command/_components/WebhookCommandMZ31.module.css`
- semantic ControlMZ2 routing patch applied by installer
- `tsconfig.social-command-mz31.json`
- `scripts/social-command/verify-mz31-source.mjs`

No SQL migration is required.
