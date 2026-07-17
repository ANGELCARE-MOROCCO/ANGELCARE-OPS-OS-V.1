Email-OS full-width workspace patch

Changed files:
- apps/ops-web/components/email-os-core/ScopedMailboxCommandCenter.tsx
- apps/ops-web/components/email-os-core/EmailOSMailboxGateDispatcher.tsx
- apps/ops-web/components/email-os-core/EnterpriseComposeModal.tsx
- apps/ops-web/components/email-os-core/ProductionComposeStudio.tsx

Purpose:
- Remove centered/max-width limitation from the scoped Email-OS command center.
- Remove centered/max-width limitation from the mailbox gate dispatcher.
- Expand the compose modal to near full viewport width.
- Expand the production compose confirmation/modal surface.

No infrastructure touched:
- Windows bridge unchanged.
- Menara unchanged.
- Supabase unchanged.
- Storage gateway backend unchanged.
- Mailbox access/PIN unchanged.

Apply from repo root:
unzip -o emailos-full-width-patch.zip -d /Users/user/Desktop/angelcare-platform
cd /Users/user/Desktop/angelcare-platform
npm run typecheck:web
npm run build:web
git add -A
git commit -m "Make Email OS workspace full width"
git push origin main
