Email-OS Compose Hotfix

Patched files:
- apps/ops-web/components/email-os-core/EnterpriseComposeModal.tsx
- apps/ops-web/components/email-os-core/ProductionComposeStudio.tsx

Fixes:
1. Prevents raw "attachments is not defined" / related JS error text from displaying in compose status panels.
2. Normalizes attachment state with safeAttachments before render/send/draft/diagnostics usage.
3. Converts escaped template newline sequences (\\n, \\r\\n, \\t) into real editor line breaks.
4. Keeps legacy inline and storage-backed attachments compatible.
5. Does not touch Windows bridge, Menara, Supabase migrations, env, or mailbox access.

Apply by copying these files over the same paths in the repo, then run:
- npm run typecheck:web
- npm run build:web
- git add -A && git commit -m "Fix Email OS compose attachment status and template newlines" && git push origin main
