# ANGELCARE Social Command MZ2 — Environment contract

MZ2 preserves every MZ1 variable and adds only the following runtime seams.

## Meta inbound events
- `SOCIAL_COMMAND_META_WEBHOOK_VERIFY_TOKEN` — private verification token configured in Meta and on the AngelCare server.
- Existing Meta App Secret remains server-only and is used to validate `X-Hub-Signature-256`.
- Public callback endpoint: `${SOCIAL_COMMAND_PUBLIC_BASE_URL}/api/social-command/meta/webhooks`.

Subscribe only fields supported by the active Meta app/capabilities. Social Command normalizes messages, messaging seen events, comments/live comments and mentions when they are delivered.

## AI sovereignty
- `SOCIAL_COMMAND_AI_CONTROL_URL` or `AI_PROVIDER_CONTROL_INTERNAL_URL` — internal AngelCare AI Provider Control execution endpoint.
- `SOCIAL_COMMAND_AI_CONTROL_SECRET` or `AI_PROVIDER_CONTROL_INTERNAL_SECRET` — optional internal service credential.
- Social Command contains no direct Gemini provider client. AI functions fail truthfully if the centralized control endpoint is not configured.

## Engagement
- `SOCIAL_COMMAND_ENGAGEMENT_ESCALATION_MINUTES` — optional threshold; default 120 minutes.
- `SOCIAL_COMMAND_INSTAGRAM_MESSAGING_HOST` — optional provider host override. Default is `https://graph.facebook.com` for the Facebook-login architecture.

## MZ1 invariants
Windows Media Gateway remains authoritative for binaries. Supabase remains metadata/operational truth only. Existing Meta token encryption and worker secret stay unchanged.
