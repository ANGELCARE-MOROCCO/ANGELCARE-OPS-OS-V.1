EMAIL-OS AUTO DISPATCH AFTER COMPOSE

This pack adds:
- /api/email-os/dispatch-now
- patch instructions for ProductionComposeStudio.tsx
- verification script

After patching compose, run:

node scripts/verify-email-os-auto-dispatch.mjs
rm -rf .next
npm run build

Then sending from Compose should:
1. create queue/outbox
2. immediately trigger queue-worker
3. update outbox to sent/failed
4. show a professional status modal
