AngelCare Email-OS Premium Final Polish Patch

Scope:
- UI/design-only premium modernization and compose hardening.
- No Windows bridge logic changed.
- No Menara SMTP/POP changes.
- No Supabase migrations/env/access changes.
- No mailbox PIN/security logic changed.

Files included:
- apps/ops-web/components/email-os-core/ScopedMailboxCommandCenter.tsx
- apps/ops-web/components/email-os-core/EmailOSMailboxGateDispatcher.tsx
- apps/ops-web/components/email-os-core/EnterpriseComposeModal.tsx
- apps/ops-web/components/email-os-core/ProductionComposeStudio.tsx
- apps/ops-web/components/email-os-core/StorageHealthPanel.tsx

What changed:
- Full-width premium Email-OS workspace shell.
- Premium white/icy-blue enterprise background and cards.
- Wider triage/detail/intelligence workspace columns.
- Production readiness strip for infrastructure, scope, workflow, storage.
- Cleaner secure mailbox gate language and premium shell.
- Compose modal now near full viewport width with premium command styling.
- Compose attachment handling uses safeAttachments to prevent raw undefined errors.
- Template text normalizes escaped \\n into real line breaks.
- Empty attachment side panel now shows a clean operational readiness message.
- Minor polish labels: “Action persistée”, AngelCare typo fixed.

Apply:
cd /Users/user/Desktop/angelcare-platform
unzip -o ~/Downloads/emailos-premium-final-polish.zip -d .
npm run typecheck:web
npm run build:web
git add -A
git commit -m "Final premium polish for Email OS workspace"
git push origin main
