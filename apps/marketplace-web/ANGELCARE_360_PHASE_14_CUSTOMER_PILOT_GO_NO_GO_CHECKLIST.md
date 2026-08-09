# ANGELCARE 360 Phase 14 Customer Pilot Go / No-Go Checklist

## Launch prerequisites
- [ ] AngelCare 360 namespace stays isolated from `app/(protected)/angelcare-360`
- [ ] Supabase migrations for Phases 2-13 are applied on the target database
- [ ] Phase 14 route and API matrices are reviewed by the owner
- [ ] TypeScript/static check passes on the target machine
- [ ] Customer accepts all locked features listed in the register

## Database checklist
- [ ] Active school exists
- [ ] Academic year and period data are present
- [ ] RBAC tables are seeded and permission keys match the active roles
- [ ] Audit log table is writable
- [ ] Phase 11-13 additive columns / constraints are present in production
- [ ] No destructive migration is queued for pilot day

## Environment checklist
- [ ] Database connection variables are configured
- [ ] Auth/session variables are configured
- [ ] Supabase URL / key pair is configured if used by the deployment
- [ ] No client-exposed secret is present in `NEXT_PUBLIC` variables
- [ ] External messaging, payment, GPS, export, and document infrastructure are either configured or intentionally blocked

## Role / permission checklist
- [ ] Administrator / Direction accounts are present
- [ ] Finance, Paie, Transport, Bibliothèque, Inventaire, Messagerie, Notifications, Réclamations, Rapports, Exports, Documents permissions are seeded
- [ ] Unauthorized users cannot reach mutation controls
- [ ] Sensitive actions are blocked when the permission is absent

## Seed / demo data checklist
- [ ] At least one active school exists
- [ ] At least one academic year exists
- [ ] At least one class, section, subject, and staff record exists
- [ ] Student, parent, and teacher reference data are present
- [ ] The pilot has enough real data to exercise each module once

## First-school onboarding checklist
- [ ] School identity and code are verified
- [ ] Default language, timezone, and currency are correct
- [ ] School contact details are correct
- [ ] Operational owners are assigned for each module

## First-admin account checklist
- [ ] Admin account can sign in
- [ ] Admin sees the command center shell
- [ ] Admin sees only the expected active modules
- [ ] Admin can open audit and locked-feature screens

## Pilot testing checklist
- [ ] Open the command center overview
- [ ] Open Administration, People, Admissions, Présences, Académique, Finance, Paie, Transport, Bibliothèque, Inventaire, Messagerie, Notifications, Réclamations, Rapports, Exports, and Documents
- [ ] Test one create/update/status mutation in each live module
- [ ] Test at least one locked action in each locked feature area
- [ ] Confirm audit events are written for critical mutations
- [ ] Confirm disabled actions show French explanations
- [ ] Confirm no fake PDF / CSV / XLSX / delivery / GPS / payment claims are exposed

## Rollback checklist
- [ ] Migration rollback plan exists and is documented
- [ ] The previous deployment hash is known
- [ ] The pilot can be disabled by route / environment rollback
- [ ] A database restore path is available if the target environment changes unexpectedly

## Support escalation checklist
- [ ] A primary school-side contact is named
- [ ] A technical contact is named
- [ ] A data correction workflow is agreed
- [ ] A security or access incident escalation path exists

## Known limitations to disclose
- [ ] PDF export is locked unless the real engine exists
- [ ] CSV / XLSX export is locked unless the real engine exists
- [ ] Generated documents remain locked without storage / generator infrastructure
- [ ] WhatsApp / SMS / external email / push are locked unless providers exist
- [ ] GPS/live tracking is locked unless a real provider exists
- [ ] Payroll legal compliance automation is locked

## Final recommendation
- Recommendation: CONDITIONAL GO FOR CONTROLLED PILOT
- Condition: user-side build and final smoke verification must still be completed on the target machine, and the customer must accept the locked features list.
