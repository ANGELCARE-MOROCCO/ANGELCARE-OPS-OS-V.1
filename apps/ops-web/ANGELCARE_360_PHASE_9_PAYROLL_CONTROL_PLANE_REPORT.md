# ANGELCARE 360 Phase 9 - Payroll Control Plane Report

## 1. Phase 9 Scope Confirmation

- Phase 9 a été posée comme couche de contrôle paie et rémunérations du `ANGELCARE 360 COMMAND CENTER`.
- Le périmètre couvre les périodes de paie, dossiers, éléments, primes, retenues, avances, ajustements, remboursements, validation, paiements internes, historique personnel, conformité verrouillée et audit paie.
- Aucun moteur légal CNSS / fiscal / bancaire n’a été simulé.

## 2. Payroll Gap Analysis

- Le socle de base existait déjà via `angelcare360_payroll_periods`, `angelcare360_payroll_records`, `angelcare360_payroll_items` dans la migration Phase 2.
- Les champs additifs nécessaires ont été ajoutés pour la validation, les statuts étendus, les motifs de blocage et l’idempotence.
- Le workflow est exploitable côté cockpit, mais les fonctions légales et bancaires restent verrouillées par conception.

## 3. Files Created

- Route tree Paie sous `app/(protected)/angelcare-360-command-center/paie/**`.
- API paie: `app/api/angelcare360/payroll/route.ts`.
- Navigation paie: `data/angelcare360/payroll-navigation.ts`.
- Helper serveur paie: `lib/angelcare360/server/payroll.ts`.
- Types paie enrichis: `types/angelcare360/payroll.ts`.
- Migration additive paie: `supabase/migrations/20260707_angelcare360_phase9_payroll_control_plane_expansion.sql`.
- Composants UI paie sous `components/angelcare360/payroll/**`.
- Rapport de phase: `ANGELCARE_360_PHASE_9_PAYROLL_CONTROL_PLANE_REPORT.md`.

## 4. Files Modified

- `lib/angelcare360/server/index.ts`
- `data/angelcare360/module-registry.ts`
- `ANGELCARE_360_IMPLEMENTATION_MASTER_PLAN.md`
- `lib/angelcare360/validation/index.ts`
- `types/angelcare360/payroll.ts`
- Aucun fichier hors périmètre Phase 9 n’a été modifié par cette implémentation, en particulier `app/(protected)/angelcare-360` reste intact.

## 5. Routes Added

- `/angelcare-360-command-center/paie`
- `/angelcare-360-command-center/paie/periodes`
- `/angelcare-360-command-center/paie/periodes/[id]`
- `/angelcare-360-command-center/paie/dossiers`
- `/angelcare-360-command-center/paie/dossiers/[id]`
- `/angelcare-360-command-center/paie/elements`
- `/angelcare-360-command-center/paie/primes`
- `/angelcare-360-command-center/paie/retenues`
- `/angelcare-360-command-center/paie/avances`
- `/angelcare-360-command-center/paie/ajustements`
- `/angelcare-360-command-center/paie/remboursements`
- `/angelcare-360-command-center/paie/validation`
- `/angelcare-360-command-center/paie/paiements`
- `/angelcare-360-command-center/paie/historique-personnel`
- `/angelcare-360-command-center/paie/conformite`
- `/angelcare-360-command-center/paie/audit`

## 6. Components Added

- `components/angelcare360/payroll/Angelcare360PayrollNavigation.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollPageShell.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollDataTable.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollRiskPanel.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollToolbar.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollReadinessPanel.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollHub.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollPeriodsWorkspace.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollPeriodDetail.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollPeriodDrawer.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollRecordsWorkspace.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollRecordDetail.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollRecordDrawer.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollItemsWorkspace.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollValidationWorkspace.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollPaymentsWorkspace.tsx`
- `components/angelcare360/payroll/Angelcare360StaffPayrollHistoryWorkspace.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollComplianceWorkspace.tsx`
- `components/angelcare360/payroll/Angelcare360PayrollAuditDrawer.tsx`

## 7. Server Helpers Added

- `lib/angelcare360/server/payroll.ts` a été créé pour couvrir les helpers de lecture, préparation, validation, blocage, paiement interne, readiness, conformité et audit.
- Helpers principaux inclus: overview, periods, records, items, bonuses, deductions, advances, adjustments, reimbursements, readiness, compliance, history, audit, export lock, bank transfer lock, compliance lock.
- Les mutations sont gardées côté serveur avec contrôle d’accès et audit.

## 8. API Routes / Server Actions Added

- API paie créée sous `app/api/angelcare360/payroll/route.ts`.
- Le routeur expose les mutations structurées pour les périodes, dossiers, éléments et blocages de conformité/export.
- Aucune écriture client-side non contrôlée n’a été ajoutée.

## 9. Additive Migrations Created

- `supabase/migrations/20260707_angelcare360_phase9_payroll_control_plane_expansion.sql`
- Ajouts principaux: `validated_at`, `validated_by`, `closed_at`, `blocked_reason`, `idempotency_key`, `payment_method`, `payment_reference`, `payment_date`.
- Les contraintes de statut ont été étendues sans SQL destructif.

## 10. Tables Used

- `angelcare360_payroll_periods`
- `angelcare360_payroll_records`
- `angelcare360_payroll_items`
- `angelcare360_staff`
- `angelcare360_academic_years`
- `angelcare360_audit_logs`
- `angelcare360_school_settings`

## 11. Validation Schemas Used / Created

- Schémas Phase 9 ajoutés dans `lib/angelcare360/validation/index.ts`.
- Noms ajoutés: `angelcare360PayrollPeriodCreateSchema`, `angelcare360PayrollPeriodUpdateSchema`, `angelcare360PayrollPeriodStatusChangeSchema`, `angelcare360PayrollRecordPrepareSchema`, `angelcare360PayrollRecordUpdateSchema`, `angelcare360PayrollRecordValidateSchema`, `angelcare360PayrollRecordBlockSchema`, `angelcare360PayrollRecordPaymentStatusSchema`, `angelcare360PayrollItemCreateSchema`, `angelcare360PayrollItemUpdateSchema`, `angelcare360PayrollItemCancelSchema`, `angelcare360PayrollHistoryFiltersSchema`, `angelcare360PayrollComplianceReadinessSchema`, `angelcare360PayrollAuditQueryFiltersSchema`.

## 12. Permission Keys Enforced

- `paie.view`
- `paie.create`
- `paie.update`
- `paie.approve`
- `audit.view`

## 13. Audit Events Implemented

- `payroll_period.created`
- `payroll_period.updated`
- `payroll_period.opened`
- `payroll_period.closed`
- `payroll_period.cancelled`
- `payroll_record.prepared`
- `payroll_record.updated`
- `payroll_record.validated`
- `payroll_record.blocked`
- `payroll_record.paid`
- `payroll_item.created`
- `payroll_item.updated`
- `payroll_item.cancelled`
- `payroll_bonus.created`
- `payroll_deduction.created`
- `payroll_advance.created`
- `payroll_adjustment.created`
- `payroll_reimbursement.created`
- `payroll_payment.confirmed`
- `payroll_export.blocked_not_available`
- `payroll_bank_transfer.blocked_not_available`
- `payroll_compliance.blocked_not_configured`

## 14. Payroll Period Strategy

- Les périodes sont persistées côté serveur, avec un seul état ouvert autorisé par établissement.
- La clôture et la validation sont auditées.
- La réouverture d’une période clôturée reste verrouillée.

## 15. Payroll Record Strategy

- Un dossier de paie est rattaché à un membre du personnel et à une période.
- L’idempotence et les doublons par période/personnel sont contrôlés.
- La validation du dossier recalculerait les totaux à partir des éléments actifs.

## 16. Payroll Item Strategy

- Les éléments sont typés: salaire de base, prime, retenue, avance, ajustement, remboursement et autres.
- Les lignes sont recalculées côté serveur après création, mise à jour ou annulation.
- Les motifs et statuts restent contrôlés par mutation serveur.

## 17. Calculation Strategy

- Formule conservatrice: calcul des totaux à partir des éléments actifs seulement.
- La paie finale reste verrouillée si les règles ne sont pas assez explicites.
- Aucun calcul légal CNSS / IR / fiscal n’a été inventé.

## 18. Payment Status Strategy

- Le statut interne de paiement est suivi au niveau du dossier.
- La confirmation de paiement reste un état de suivi interne, pas une exécution bancaire.
- Les références et méthodes sont conservées si disponibles.

## 19. Payslip / Export Lock Strategy

- Le PDF de bulletin de paie reste verrouillé.
- Message verrouillé utilisé: `Le bulletin de paie PDF sera activé dans la phase Rapports & Exports.`

## 20. Bank Transfer Lock Strategy

- Le virement bancaire reste verrouillé.
- Message verrouillé utilisé: `Le virement bancaire nécessite une intégration bancaire configurée.`

## 21. Compliance Lock Strategy

- CNSS, fiscalité, déclarations et conformité légale restent verrouillées.
- Message verrouillé utilisé: `Les règles sociales, fiscales et CNSS doivent être validées avant automatisation.`

## 22. Data Sources Used

- Tables de paie Phase 2.
- Table personnel Phase 4.
- Table années scolaires Phase 3.
- Table audit Phase 2.
- Contexte d’accès et permissions du socle Phase 2.

## 23. Buttons / Actions Implemented

- Navigation vers le cockpit, les périodes, les dossiers, la validation, l’audit et la conformité.
- Aucune écriture dangereuse n’a été exposée comme bouton client-side non contrôlé.
- Les mutations existent côté serveur/API, pas via faux boutons.

## 24. Disabled Actions and Why

- Export PDF paie: pas d’infrastructure d’export réelle.
- Virement bancaire: aucune intégration bancaire configurée.
- Conformité sociale/fiscale/CNSS: règles non validées.
- Réouverture de périodes clôturées: workflow explicite absent.

## 25. Security Decisions

- Vérification d’accès serveur avant chaque lecture sensible.
- Mutations gardées derrière permission et audit.
- Idempotence / anti-doublons sur périodes, dossiers et éléments.
- Aucun secret ni write-service n’a été exposé au client.

## 26. Server / Client Boundary Decisions

- Les pages route sont en server components.
- Les composants client servent seulement à la navigation et au rendu interactif léger.
- Les mutations vivent dans le helper serveur et le routeur API.

## 27. Existing App Impact

- Le registre du command center active désormais `Paie`.
- La navigation paie pointe vers de vraies routes.
- Le shell global du produit n’a pas été modifié.

## 28. Confirmation `app/(protected)/angelcare-360` Was Not Touched

- Aucun fichier de `app/(protected)/angelcare-360` n’a été modifié par cette phase.

## 29. Confirmation Unrelated Areas Were Not Touched

- Les zones hors périmètre telles que transport, bibliothèque, inventaire, messagerie et rapport/export global n’ont pas été construites.

## 30. TypeScript / Static Checks Run

- Commande exécutée: `test -x ./node_modules/.bin/tsc && NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`
- Résultat: échec à cause d’erreurs préexistantes hors Phase 9 dans `data/angelcare360/people-pages.ts`, `lib/angelcare360/server/attendance.ts`, `lib/angelcare360/server/context.ts`, `lib/angelcare360/server/people.ts`, `lib/angelcare360/server/timetable.ts`.

## 31. Full Build Status

- NOT RUN BY ORDER.

## 32. Known Limitations

- La conformité paie n’est pas automatisée.
- Le PDF de bulletin de paie reste verrouillé.
- Le virement bancaire reste verrouillé.
- Le calcul final reste conservateur et peut rester verrouillé selon le contexte.

## 33. Risks Before Production

- Les erreurs TypeScript existantes hors Phase 9 doivent être corrigées avant un build de production.
- Les règles de calcul légales devront être validées séparément.
- Les workflows d’édition avancée restent surtout côté serveur/API, pas encore en formulaires complets.

## 34. Exact Recommended Phase 10 Prompt

- `APPROVE PHASE 10 — PRODUCTION HARDENING / SECURITY / VERIFICATION / FINAL QA OPERATING ENGINE ONLY — NO BUILD ALLOWED.`
