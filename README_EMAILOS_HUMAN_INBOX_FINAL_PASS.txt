Email-OS Human Inbox UX Final Pass

Changed file:
- apps/ops-web/components/email-os-core/ScopedMailboxCommandCenter.tsx

Purpose:
- Replaces the oversized cockpit-style mailbox workspace with a compact human inbox layout.
- Keeps a full-height Gmail/Front-style 3-column workspace: inbox list, message reader, context/actions.
- Compresses the giant top dashboard into a practical mailbox command header.
- Moves infrastructure/storage/diagnostics language into a collapsed System health & diagnostics area.
- Removes operator-facing phrases like "Action persistée".
- Keeps all existing workflow actions wired: reply, forward, archive, mark read/unread, status, priority, category, assign, note, task, link, resolve.
- Keeps Windows/Menara/Supabase/storage backend untouched.

After applying:
- npm run typecheck:web
- npm run build:web
- git add -A && git commit -m "Final human inbox UX pass for Email OS" && git push origin main
