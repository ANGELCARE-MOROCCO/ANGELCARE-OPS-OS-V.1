# TrainingHub Final Production Completion Checklist

This is the hard gate before real paid partners.

## Non-negotiable PASS conditions

1. Static production hardening verifier passes.
2. Supabase environment variables are present.
3. Required tables are reachable with service role.
4. TypeScript passes.
5. Next production build passes.
6. End-to-end partner journey smoke passes.
7. Partner login works with generated credentials.
8. Partner portal only reads its own organization data.
9. Offer → order → invoice → credits → session → participant → certificate chain is proven.
10. Suspend/restore access is proven.
11. Delete is tested only on smoke data, or replaced by archive in real production operations.

## Commands

```bash
cd ~/Desktop/angelcare-opsos-app

node --env-file=.env.local scripts/verify-traininghub-production-hardening-static.mjs

node --env-file=.env.local scripts/traininghub-final-production-completion-gate.mjs --with-tsc

node --env-file=.env.local scripts/traininghub-e2e-prod-journey-smoke.mjs

node --env-file=.env.local scripts/traininghub-final-production-completion-gate.mjs --full
```

## Manual customer-readiness test

- Create a partner.
- Set login email + temporary password.
- Open `/traininghub/partner` in incognito.
- Login with partner credentials.
- Confirm only the partner's own dossier/data is visible.
- Create/confirm an offer.
- Convert to order.
- Generate invoice.
- Allocate training credits.
- Plan session.
- Add participants.
- Mark presence.
- Issue certificates.
- Confirm proofs appear in partner portal.
- Suspend access.
- Confirm partner access is blocked or restricted.
- Restore access.
- Confirm partner access works again.

Do not onboard real customers until this checklist passes.
