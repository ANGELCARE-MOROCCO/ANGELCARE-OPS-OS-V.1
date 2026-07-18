Email-OS Mailbox Fundamentals Correction

Base used:
- The latest already-patched human inbox result from this conversation: angelcare-platform-full-human-inbox-final-pass.zip
- No Codex involved.

Changed file:
- apps/ops-web/components/email-os-core/ScopedMailboxCommandCenter.tsx

What this restores:
- Permanent mailbox rail inside scoped mailbox workspace.
- Inbox
- Unread
- Sent / Outbox
- Drafts
- Scheduled
- Failed
- All Mail
- Archived
- Spam
- Trash
- Templates

Behavior:
- Folder counts are visible.
- Inbox/Unread/All Mail/Archived/Spam/Trash filter message records locally.
- Sent / Outbox, Scheduled, Failed load existing /api/email-os/outbox records.
- Drafts loads existing /api/email-os/saved-drafts records.
- Templates opens the existing template drawer.
- Empty folders show clean operational empty states, not dead UI.

Untouched:
- Windows bridge/server.js
- Menara SMTP/POP
- Supabase migrations
- Storage gateway backend
- Vercel env
- mailbox PIN/access logic
- send-mail transport
- inbound sync transport

After applying:
- npm run typecheck:web
- npm run build:web
- git add -A
- git commit -m "Restore Email OS mailbox folders"
- git push origin main
