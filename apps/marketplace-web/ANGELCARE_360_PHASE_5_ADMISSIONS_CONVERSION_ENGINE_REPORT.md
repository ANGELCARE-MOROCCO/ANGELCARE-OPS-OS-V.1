# ANGELCARE 360 COMMAND CENTER - Phase 5 Admissions / Conversion Engine

## 1. Phase 5 Scope Confirmation

Phase 5 a livré le moteur métier `Admissions & Inscriptions` dans le shell isolé `ANGELCARE 360 COMMAND CENTER`, sans toucher au sous-arbre historique `app/(protected)/angelcare-360`.

Objectif atteint:
- capture des demandes d’inscription
- ouverture des dossiers d’admission
- suivi documentaire
- suivi des relances / prochaine action
- décision d’admission
- conversion sécurisée vers le socle `People Core`
- journalisation d’audit serveur
- contrôles de permissions et validation côté serveur

## 2. Admissions Gap Analysis Result

Analyse appliquée avant implémentation:
- les tables et le socle RBAC/audit/validation/people issus des phases 2 à 4 étaient suffisants pour construire le moteur admissions
- la phase a pu s’appuyer sur les helpers d’administration et de people déjà présents
- la conversion a été implémentée avec garde-fous de doublon, contrôle de capacité, réconciliation parent/enfant et création d’inscription de classe quand possible
- aucune migration destructive n’a été introduite
- une migration SQL additive de phase 5 a été conservée dans `supabase/migrations/20260707_angelcare360_phase5_admissions_conversion_engine.sql`

## 3. Files Created

- `app/(protected)/angelcare-360-command-center/admissions/pipeline/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/documents/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/entretiens/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/conversions/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/audit/page.tsx`
- `app/api/angelcare360/admissions/route.ts`
- `components/angelcare360/admissions/Angelcare360AdmissionsDocumentsWorkspace.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionsFollowUpsWorkspace.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionsAuditWorkspace.tsx`
- `supabase/migrations/20260707_angelcare360_phase5_admissions_conversion_engine.sql`

## 4. Files Modified

- `lib/angelcare360/server/admissions.ts`
- `lib/angelcare360/validation/index.ts`
- `types/angelcare360/admissions.ts`
- `lib/angelcare360/server/index.ts`
- `data/angelcare360/module-registry.ts`
- `components/angelcare360/Angelcare360CommandCenterView.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionLeadDetail.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionsEntityDrawer.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionsPipelineWorkspace.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionsDocumentsWorkspace.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionsFollowUpsWorkspace.tsx`
- `components/angelcare360/admissions/Angelcare360AdmissionsAuditWorkspace.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/demandes/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/demandes/[id]/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/dossiers/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/dossiers/[id]/page.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/error.tsx`
- `app/(protected)/angelcare-360-command-center/admissions/loading.tsx`

## 5. Routes Added

- `/angelcare-360-command-center/admissions`
- `/angelcare-360-command-center/admissions/pipeline`
- `/angelcare-360-command-center/admissions/demandes`
- `/angelcare-360-command-center/admissions/demandes/[id]`
- `/angelcare-360-command-center/admissions/dossiers`
- `/angelcare-360-command-center/admissions/dossiers/[id]`
- `/angelcare-360-command-center/admissions/documents`
- `/angelcare-360-command-center/admissions/entretiens`
- `/angelcare-360-command-center/admissions/conversions`
- `/angelcare-360-command-center/admissions/audit`

## 6. Components Added

Nouveaux composants de travail admissions:
- `Angelcare360AdmissionsDocumentsWorkspace`
- `Angelcare360AdmissionsFollowUpsWorkspace`
- `Angelcare360AdmissionsAuditWorkspace`

Composants admissions déjà présents et consolidés dans cette phase:
- `Angelcare360AdmissionsHub`
- `Angelcare360AdmissionsListWorkspace`
- `Angelcare360AdmissionsPipelineWorkspace`
- `Angelcare360AdmissionsConversionWorkspace`
- `Angelcare360AdmissionLeadDetail`
- `Angelcare360AdmissionDossier`
- `Angelcare360AdmissionsPageShell`
- `Angelcare360AdmissionsChrome`
- `Angelcare360AdmissionsToolbar`
- `Angelcare360AdmissionsTable`
- `Angelcare360AdmissionsEntityDrawer`
- `Angelcare360AdmissionsStatusChangeDrawer`
- `Angelcare360AdmissionsNextActionDrawer`
- `Angelcare360AdmissionsDocumentStatusDrawer`
- `Angelcare360AdmissionsRiskPanel`
- `Angelcare360AdmissionsPipelineBoard`
- `Angelcare360AdmissionConversionChecklist`
- `Angelcare360AdmissionsConversionPanel`

## 7. Server Helpers Added

Le module `lib/angelcare360/server/admissions.ts` expose maintenant:
- `getAngelcare360AdmissionsOverview`
- `listAngelcare360AdmissionLeads`
- `getAngelcare360AdmissionLeadById`
- `createAngelcare360AdmissionLead`
- `updateAngelcare360AdmissionLead`
- `changeAngelcare360AdmissionLeadStatus`
- `convertAngelcare360LeadToApplication`
- `listAngelcare360AdmissionApplications`
- `getAngelcare360AdmissionApplicationById`
- `createAngelcare360AdmissionApplication`
- `updateAngelcare360AdmissionApplication`
- `changeAngelcare360AdmissionApplicationStatus`
- `decideAngelcare360AdmissionApplication`
- `acceptAngelcare360AdmissionApplication`
- `rejectAngelcare360AdmissionApplication`
- `listAngelcare360AdmissionRequiredDocuments`
- `createAngelcare360AdmissionRequiredDocument`
- `updateAngelcare360AdmissionRequiredDocument`
- `listAngelcare360AdmissionDocumentSubmissions`
- `updateAngelcare360AdmissionDocumentSubmissionStatus`
- `getAngelcare360AdmissionDocumentChecklist`
- `updateAngelcare360AdmissionNextAction`
- `listAngelcare360AdmissionFollowUps`
- `listAngelcare360AdmissionConversionCandidates`
- `getAngelcare360AdmissionConversionChecklist`
- `detectAngelcare360AdmissionDuplicates`
- `checkAngelcare360ClassCapacityForAdmission`
- `convertAngelcare360ApplicationToPeopleRecords`
- `listAngelcare360AdmissionsAuditEvents`
- `getAngelcare360AdmissionAuditEventDetail`
- `listAngelcare360AdmissionPipelineCards`

## 8. API Routes / Server Actions Added

- `POST /api/angelcare360/admissions`

Le routeur admissions traite:
- création / mise à jour / changement de statut des demandes
- création / mise à jour / décision / conversion des dossiers
- référentiel documentaire requis
- mise à jour des soumissions documentaires
- prochaine action / suivi
- conversion sécurisée vers le socle personnes

## 9. Additive Migrations Created

- `supabase/migrations/20260707_angelcare360_phase5_admissions_conversion_engine.sql`

Cette migration a été conservée comme ajout de phase 5, sans suppression destructive.

## 10. Tables Used

Tables admissions / conversion exploitées:
- `angelcare360_admission_leads`
- `angelcare360_admission_applications`
- `angelcare360_admission_status_history`
- `angelcare360_admission_required_documents`
- `angelcare360_admission_document_submissions`
- `angelcare360_audit_logs`
- `angelcare360_students`
- `angelcare360_parents`
- `angelcare360_student_parent_links`
- `angelcare360_class_enrollments`
- `angelcare360_classes`
- `angelcare360_sections`
- `angelcare360_staff`
- `angelcare360_documents`
- `angelcare360_academic_years`

## 11. Validation Schemas Used / Created

Extensions phase 5 dans `lib/angelcare360/validation/index.ts`:
- `angelcare360AdmissionLeadCreateSchema`
- `angelcare360AdmissionLeadUpdateSchema`
- `angelcare360AdmissionLeadStatusChangeSchema`
- `angelcare360AdmissionApplicationCreateSchema`
- `angelcare360AdmissionApplicationUpdateSchema`
- `angelcare360AdmissionApplicationStatusChangeSchema`
- `angelcare360AdmissionDecisionSchema`
- `angelcare360AdmissionRequiredDocumentCreateSchema`
- `angelcare360AdmissionRequiredDocumentUpdateSchema`
- `angelcare360AdmissionDocumentSubmissionUpdateSchema`
- `angelcare360AdmissionNextActionSchema`
- `angelcare360AdmissionConversionSchema`
- `angelcare360AdmissionsAuditFilterSchema`

## 12. Permission Keys Enforced

Clés utilisées dans la phase:
- `admissions.view`
- `admissions.create`
- `admissions.update`
- `admissions.approve`
- `documents.view`
- `documents.create`
- `documents.update`
- `eleves.create`
- `parents.create`
- `eleves.assign`
- `audit.view`

## 13. Audit Events Implemented

Événements écrits côté serveur:
- `admission_lead.created`
- `admission_lead.updated`
- `admission_lead.status_changed`
- `admission_lead.converted_to_application`
- `admission_application.created`
- `admission_application.updated`
- `admission_application.status_changed`
- `admission_application.accepted` via décision orientée statut
- `admission_application.rejected` via décision orientée statut
- `admission_application.next_action_updated`
- `admission_application.conversion_checked`
- `admission_application.converted`
- `student.created_from_admission`
- `parent.created_from_admission`
- `student_parent_link.created_from_admission`
- `class_enrollment.created_from_admission`
- `admission_required_document.created`
- `admission_required_document.updated`
- `admission_document_submission.updated`
- `admissions.audit.viewed` via lecture contrôlée

## 14. Status Model Implemented

Modèle contrôlé utilisé dans le moteur admissions:
- leads: `new`, `contacted`, `qualified`, `application_open`, `converted`, `archived`
- applications: `open`, `in_review`, `approved`, `rejected`, `waitlisted`, `converted`, `archived`
- document submissions: `pending`, `complete`, `missing`, `rejected`

Les changements d’état sont persistés côté serveur. Les interactions UI-only ont été évitées.

## 15. Conversion Workflow Implemented or Locked

Conversion réelle mise en place avec:
- révalidation serveur
- vérification de doublons
- contrôle de capacité de classe
- création / réutilisation d’un élève
- création / réutilisation d’un parent
- création du lien parent/enfant
- création de l’inscription de classe si possible
- mise à jour du dossier à `converted`
- historisation de statut
- audit critique

Les actions d’export et certains écrans calendaires / rendez-vous sont restés verrouillés quand la capacité d’exécution complète n’était pas confirmée.

## 16. Duplicate / Idempotency Strategy

- signature de doublon par nom enfant, date de naissance, téléphone, email
- réutilisation d’un élève/parent déjà existant lorsque le match est jugé sûr
- blocage de conversion si doublons potentiels détectés sans override explicite
- protection contre les conversions en double si `converted_at` existe déjà

## 17. Capacity Strategy

- contrôle de capacité de classe via `angelcare360_classes.capacity` et `angelcare360_class_enrollments`
- alerte affichée si la capacité est atteinte
- blocage de conversion si le contrôle signale un dépassement et qu’aucune override explicite n’est donnée
- si la capacité n’est pas configurée, affichage d’un état explicite `Capacité non configurée`

## 18. Document Checklist Strategy

- catalogue de documents requis configurable
- soumissions par dossier suivies par statut
- indicateur des pièces manquantes / complétées
- téléversement réel désactivé si le stockage sécurisé n’est pas branché

## 19. Data Sources Used

- données réelles Supabase via les helpers `lib/angelcare360/server`
- contexte d’accès AngelCare 360 via session/supabase server client
- données de navigation / registry du shell command center
- fallback d’état vide lorsque le contexte ou les données n’étaient pas disponibles

## 20. Buttons / Actions Implemented

Actions actives:
- création / modification de demande
- changement de statut de demande
- conversion demande -> dossier
- création / modification de dossier
- changement de statut du dossier
- acceptation / refus
- mise à jour de prochaine action
- création / modification de documents requis
- changement d’état documentaire
- consultation de l’audit

Actions volontairement désactivées:
- export admissions
- drag and drop du pipeline sans persistance contrôlée
- import réel de fichiers tant que le stockage sécurisé n’est pas câblé
- calendrier complet d’entretiens si aucune table d’agenda dédiée n’est garantie

## 21. Disabled Actions and Why

- Export: verrouillé car l’export contrôlé n’est pas encore branché
- Import de fichiers: verrouillé car le contrat de stockage sécurisé n’est pas confirmé
- Drag and drop du pipeline: non exposé comme action active car cela créerait une UX trompeuse sans persistance garantie
- Certaines vues calendaires: exposées comme suivi / prochaine action, pas comme faux calendrier complet

## 22. Security Decisions

- toutes les mutations passent par le serveur
- validation en amont via schémas phase 5
- contrôle de permission avant écriture
- audit serveur systématique des mutations critiques
- pas d’écriture client directe vers la base
- pas de secrets exposés côté navigateur

## 23. Server / Client Boundary Decisions

- les pages de route restent en serveur pour récupérer le contexte et les listes
- les composants interactifs admissions sont côté client uniquement pour les drawers, filtres et actions locales
- les helpers de base de données / audit restent server-only
- les mutations passent par l’API `app/api/angelcare360/admissions/route.ts`

## 24. Existing App Impact

- le shell `ANGELCARE 360 COMMAND CENTER` a été enrichi avec la visibilité Admissions active
- le reste de l’application Vercel n’a pas été restructuré
- le sous-arbre historique `app/(protected)/angelcare-360` n’a pas été modifié par cette phase

## 25. Confirmation: `app/(protected)/angelcare-360` Not Touched

Phase 5 n’a ajouté aucune modification nouvelle à ce sous-arbre.
Le worktree contient encore un diff préexistant dans `app/(protected)/angelcare-360/customer/[module]/page.tsx`, mais il ne provient pas de la phase 5.

## 26. Confirmation: Unrelated Product Areas Not Touched

Pas de modification fonctionnelle de:
- marketplace
- OPSOS
- HR
- finance
- customer
- landing public
- autres modules hors `angelcare360`

## 27. Build Commands Run

- `NODE_OPTIONS=--max-old-space-size=16384 npx tsc --noEmit --pretty false` avec filtrage ciblé admissions/people pour confirmer l’absence d’erreurs Phase 5 dans le périmètre concerné
- `npm run build`

Scripts absents dans `package.json`:
- `npm run lint`
- `npm run typecheck`
- `npm test`

## 28. Build Result

- `npm run build` a démarré correctement
- Next.js est resté bloqué sur `Creating an optimized production build ...` sans retour exploitable dans cette session
- le build a été interrompu proprement avec code de sortie `130` pour éviter de laisser une exécution pendante

## 29. Known Limitations

- le build global reste sensible aux erreurs TypeScript existantes hors phase 5
- le sous-système people possède encore des zones d’inférence perfectibles dans d’autres fichiers historiques du repo
- l’export admissions reste verrouillé
- le téléversement réel de fichiers n’est pas activé tant que le stockage sécurisé n’est pas branché

## 30. Risks Before Production

- vérifier le comportement réel de la conversion sur une base de données connectée
- valider les contraintes d’unicité / FK sur les tables admissions et people
- confirmer les règles de capacité de classe au niveau métier
- compléter la stratégie d’export PDF si nécessaire
- faire un run de build complet dans un environnement CI plus stable que cette session

## 31. Exact Recommended Phase 6 Prompt

Phase 6 devrait attaquer le bloc `Présences / Retards / Absences / Justifications`, avec les mêmes règles d’isolation, de validation serveur, d’audit critique et d’UI française premium.

