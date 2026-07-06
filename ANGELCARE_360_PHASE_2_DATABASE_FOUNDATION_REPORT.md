# ANGELCARE 360 COMMAND CENTER - Phase 2 Database / RBAC / Security / Domain Backbone Report

## 1. Prefix choisi

- Préfixe retenu: `angelcare360_`
- Raison:
  - Il isole clairement le nouveau produit ANGELCARE 360 COMMAND CENTER du sous-arbre historique `ac360_`.
  - Il évite toute collision avec les tables et migrations existantes du repo.
  - Il reste lisible, stable, et cohérent avec le namespace applicatif `angelcare360`.

## 2. Fichiers créés

### Migrations

- `supabase/migrations/20260706_angelcare360_phase2_01_foundation.sql`
- `supabase/migrations/20260706_angelcare360_phase2_02_demo_seed.sql`

### Types de domaine

- `types/angelcare360/database.ts`
- `types/angelcare360/rbac.ts`
- `types/angelcare360/people.ts`
- `types/angelcare360/school-structure.ts`
- `types/angelcare360/admissions.ts`
- `types/angelcare360/attendance.ts`
- `types/angelcare360/academics.ts`
- `types/angelcare360/finance.ts`
- `types/angelcare360/payroll.ts`
- `types/angelcare360/transport.ts`
- `types/angelcare360/library.ts`
- `types/angelcare360/inventory.ts`
- `types/angelcare360/communications.ts`
- `types/angelcare360/audit.ts`

### Validation

- `lib/angelcare360/validation/index.ts`

### Backend server helpers

- `lib/angelcare360/server/context.ts`
- `lib/angelcare360/server/queries.ts`
- `lib/angelcare360/server/audit.ts`
- `lib/angelcare360/server/index.ts`

### Audit persistence

- `app/api/angelcare360/audit/route.ts`

## 3. Fichiers modifiés

- `lib/angelcare360/audit.ts`
- `ANGELCARE_360_IMPLEMENTATION_MASTER_PLAN.md`

## 4. Tables créées

Le backbone Phase 2 couvre 74 tables métier et de sécurité, regroupées par domaine:

- Tenancy / établissement:
  - `angelcare360_schools`
  - `angelcare360_school_settings`
  - `angelcare360_academic_years`
  - `angelcare360_terms`
- RBAC / accès:
  - `angelcare360_roles`
  - `angelcare360_permissions`
  - `angelcare360_role_permissions`
  - `angelcare360_user_roles`
  - `angelcare360_access_scopes`
- People:
  - `angelcare360_students`
  - `angelcare360_parents`
  - `angelcare360_student_parent_links`
  - `angelcare360_staff`
  - `angelcare360_staff_contracts`
  - `angelcare360_staff_assignments`
  - `angelcare360_emergency_contacts`
  - `angelcare360_documents`
- Structure scolaire:
  - `angelcare360_classes`
  - `angelcare360_sections`
  - `angelcare360_subjects`
  - `angelcare360_class_subjects`
  - `angelcare360_class_enrollments`
  - `angelcare360_teacher_assignments`
- Admissions:
  - `angelcare360_admission_leads`
  - `angelcare360_admission_applications`
  - `angelcare360_admission_status_history`
  - `angelcare360_admission_required_documents`
  - `angelcare360_admission_document_submissions`
- Présences / opérations:
  - `angelcare360_attendance_sessions`
  - `angelcare360_attendance_records`
  - `angelcare360_attendance_justifications`
  - `angelcare360_attendance_status_history`
  - `angelcare360_timetable_slots`
  - `angelcare360_school_calendar_events`
- Académique:
  - `angelcare360_lessons`
  - `angelcare360_assignments`
  - `angelcare360_assignment_submissions`
  - `angelcare360_exams`
  - `angelcare360_exam_sessions`
  - `angelcare360_marks`
  - `angelcare360_report_cards`
  - `angelcare360_report_card_lines`
  - `angelcare360_teacher_comments`
- Finance:
  - `angelcare360_fee_structures`
  - `angelcare360_fee_items`
  - `angelcare360_student_fee_assignments`
  - `angelcare360_invoices`
  - `angelcare360_invoice_lines`
  - `angelcare360_payments`
  - `angelcare360_receipts`
  - `angelcare360_discounts`
  - `angelcare360_payment_reminders`
  - `angelcare360_finance_accounts`
  - `angelcare360_expenses`
- Paie:
  - `angelcare360_payroll_periods`
  - `angelcare360_payroll_records`
  - `angelcare360_payroll_items`
- Transport:
  - `angelcare360_transport_routes`
  - `angelcare360_transport_stops`
  - `angelcare360_transport_vehicles`
  - `angelcare360_transport_assignments`
- Bibliothèque:
  - `angelcare360_library_books`
  - `angelcare360_library_copies`
  - `angelcare360_library_loans`
- Inventaire:
  - `angelcare360_inventory_categories`
  - `angelcare360_inventory_items`
  - `angelcare360_inventory_movements`
- Communication:
  - `angelcare360_messages`
  - `angelcare360_message_recipients`
  - `angelcare360_notifications`
  - `angelcare360_announcements`
  - `angelcare360_reclamations`
- Reporting:
  - `angelcare360_reports`
  - `angelcare360_report_exports`
- Sécurité / audit:
  - `angelcare360_audit_logs`

## 5. Finalité des tables

- Les tables de tenancy portent la notion d’établissement, d’année scolaire, de trimestres, et de configuration locale.
- Les tables RBAC définissent les rôles, permissions, scopes, et l’affectation par utilisateur.
- Les tables people couvrent les dossiers élèves, parents, personnel, liens parent-enfant, contrats, affectations et documents.
- Les tables de structure modélisent classes, sections, matières, affectations et inscriptions.
- Les tables admissions supportent le pipeline de demandes, l’historique de statut et la collecte documentaire.
- Les tables attendance et calendar supportent sessions journalières, états de présence, justifications, planning et évènements.
- Les tables académiques supportent cours, devoirs, examens, notes, moyennes, bulletins et appréciations.
- Les tables finance supportent barèmes, factures, lignes, paiements, reçus, remises, relances, comptes et dépenses.
- Les tables payroll supportent périodes, fiches et lignes de paie.
- Les tables transport supportent routes, stops, véhicules et affectations.
- Les tables library supportent livres, exemplaires et prêts.
- Les tables inventory supportent catégories, articles et mouvements de stock.
- Les tables communication supportent messages internes, destinataires, notifications, annonces et réclamations.
- Les tables reporting supportent les définitions de rapports et l’historique d’exports.
- `angelcare360_audit_logs` constitue la trace d’audit centrale.

## 6. Relations

- `school_id` structure la quasi-totalité des entités métier.
- `academic_year_id` relie les cycles scolaires, classes, inscriptions, sessions, bulletins, paie et éléments dépendants.
- `student_id`, `parent_id`, `staff_id`, `class_id`, `section_id`, `subject_id`, `invoice_id`, `payment_id` et `entity_id` sont utilisés comme pivots relationnels selon le domaine.
- Les liens many-to-many sont matérialisés par:
  - `angelcare360_student_parent_links`
  - `angelcare360_class_subjects`
  - `angelcare360_class_enrollments`
  - `angelcare360_teacher_assignments`
  - `angelcare360_role_permissions`
  - `angelcare360_user_roles`
  - `angelcare360_message_recipients`
- Les dépendances critiques ont été gérées avec des clés étrangères différées lorsque nécessaire pour éviter les cycles de création.

## 7. Clés étrangères

- Les FKs relient les tables cœur aux écoles, années scolaires, classes, sections, matières, étudiants, parents, staff, factures, paiements, prêts et logs.
- Les contraintes différées ont été utilisées pour:
  - `angelcare360_user_roles.access_scope_id`
  - `angelcare360_staff_assignments.class_id`
  - `angelcare360_staff_assignments.section_id`
  - `angelcare360_staff_assignments.subject_id`
  - `angelcare360_students.current_class_id`
  - `angelcare360_students.current_section_id`
  - `angelcare360_report_card_lines.teacher_comment_id`

## 8. Indexes

- Indexes ajoutés sur:
  - `school_id`
  - `academic_year_id`
  - `status`
  - `created_at`
  - `student_id`
  - `parent_id`
  - `staff_id`
  - `class_id`
  - `section_id`
  - `invoice_id`
  - `payment_date`
  - `attendance_date`
  - `module`
  - `action`
  - `entity_type`
  - `entity_id`
  - les champs de recherche fréquents des people, finance, attendance, communication et reporting

## 9. Contraintes

- `school_code` est unique.
- `permission_key` est unique.
- `role_key` est unique.
- Les contraintes de domaine assurent la cohérence des statuts et de certains montants/quantités.
- Les tables de liaison ont des contraintes d’unicité adaptées pour éviter les doublons de relation.

## 10. RLS / sécurité

- Le choix d’implémentation est volontairement conservateur:
  - RLS activé sur les tables AngelCare 360 lorsque le modèle du repo le permet.
  - Politiques restreintes à l’usage service-role / serveur.
  - Aucune table critique n’est laissée publiquement writable.
  - Les mutations sensibles restent côté serveur.
- Les domaines finance, paie, audit, RBAC et documents sont traités plus strictement que les données de lecture.
- La route d’audit publique applicative n’est pas publique au sens anonyme:
  - elle impose une session
  - elle vérifie la permission `audit.log.create`
  - elle écrit via un helper serveur

## 11. Rôles RBAC créés

- `super_admin`
- `direction_generale`
- `direction_etablissement`
- `administration`
- `reception`
- `enseignant`
- `parent`
- `eleve`
- `comptabilite`
- `rh`
- `transport`
- `bibliotheque`
- `qualite`
- `support`

## 12. Catalogue de permissions

- 27 domaines couverts:
  - direction
  - admissions
  - eleves
  - parents
  - enseignants
  - personnel
  - classes
  - matieres
  - annees_scolaires
  - presences
  - emploi_du_temps
  - academics
  - examens
  - bulletins
  - finance
  - paiements
  - paie
  - transport
  - bibliotheque
  - inventaire
  - messagerie
  - notifications
  - reclamations
  - documents
  - rapports
  - parametres
  - audit
  - securite
- 10 actions:
  - `view`
  - `create`
  - `update`
  - `delete`
  - `approve`
  - `export`
  - `assign`
  - `notify`
  - `configure`
  - `audit`
- Total permissions generated: 270

## 13. Stratégie role-permission

- `super_admin` reçoit toutes les permissions.
- Les rôles de direction reçoivent un périmètre large orienté supervision, configuration et validation.
- Les rôles métiers reçoivent un sous-ensemble par domaine.
- Les rôles parent/élève restent fortement limités à consultation et interaction personnelle.
- `angelcare360_access_scopes` prépare l’extension route/action/module par établissement.

## 14. Données de démonstration

- Le seed crée un contexte de démonstration marocain/français:
  - une école fictive
  - une année scolaire active
  - deux trimestres
  - des classes, sections, matières
  - des élèves, parents, staff et contrats
  - des admissions, présences, cours, examens, factures, paiements, reçus, remises
  - des éléments transport, bibliothèque, inventaire, messagerie, notifications, annonces, réclamations, rapports, exports
  - un événement d’audit initial
- Les données sont clairement de type demo / development only.

## 15. Schémas de validation ajoutés

Nombre de schémas couverts: 25

- école
- année scolaire
- rôle
- permission
- élève
- parent
- personnel
- classe
- section
- matière
- admission lead
- présence
- créneau de planning
- devoir
- examen
- note
- facture
- paiement
- paie
- route de transport
- livre
- article d’inventaire
- message
- notification
- audit

Les messages d’erreur utilisateur sont en français.

## 16. Typescript domain types ajoutés

Nombre de fichiers de types: 14

- `database.ts`
- `rbac.ts`
- `people.ts`
- `school-structure.ts`
- `admissions.ts`
- `attendance.ts`
- `academics.ts`
- `finance.ts`
- `payroll.ts`
- `transport.ts`
- `library.ts`
- `inventory.ts`
- `communications.ts`
- `audit.ts`

## 17. Data access helpers ajoutés

- `getAngelcare360AccessContext`
- `requireAngelcare360Permission`
- `listAngelcare360Schools`
- `getAngelcare360ActiveSchool`
- `listAngelcare360AcademicYears`
- `getAngelcare360DashboardFoundation`
- `listAngelcare360Roles`
- `listAngelcare360Permissions`
- `listAngelcare360Students`
- `listAngelcare360Parents`
- `listAngelcare360Staff`
- `listAngelcare360Classes`
- `listAngelcare360AttendanceFoundation`
- `listAngelcare360FinanceFoundation`
- `recordAngelcare360AuditEvent`

Ces helpers sont serveur uniquement et utilisent le client Supabase de type service-role déjà adopté par le repo.

## 18. Audit persistence

- Le fichier `lib/angelcare360/audit.ts` a été converti en primitive compatible backend:
  - construction d’évènement structurée
  - envoi vers `/api/angelcare360/audit`
  - fallback non bloquant côté UI
- Le serveur persiste les évènements via:
  - `lib/angelcare360/server/audit.ts`
  - `app/api/angelcare360/audit/route.ts`
- La persistance capture:
  - severity
  - module
  - action
  - entity
  - before/after
  - metadata
  - request context

## 19. Routes API ajoutées

- `POST /api/angelcare360/audit`

La route est strictement orientée audit, avec:

- contrôle de session
- vérification de permission
- validation d’entrée
- écriture serveur
- réponse structurée

## 20. Impact sur l’application existante

- Aucun écran métier Phase 3 n’a été ajouté.
- Aucun module hors AngelCare 360 n’a été modifié intentionnellement.
- Le sous-arbre existant `app/(protected)/angelcare-360` n’a pas été touché par ce travail Phase 2.
- Le seul fichier hors namespace AngelCare 360 présent dans `git status` est une modification déjà existante:
  - `app/(protected)/angelcare-360/customer/[module]/page.tsx`
  - je ne l’ai pas modifié durant Phase 2
  - il a été conservé intact

## 21. Confirmation d’isolement

- L’ensemble du backbone Phase 2 vit dans:
  - `supabase/migrations/`
  - `types/angelcare360/`
  - `lib/angelcare360/`
  - `app/api/angelcare360/`
- Le sous-arbre `app/(protected)/angelcare-360` reste séparé.
- Les modules marketplace, OPSOS, finance, HR et autres systèmes n’ont pas été pollués.

## 22. Contrôles exécutés

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- `git diff --name-only -- "app/(protected)/angelcare-360"`
- `npm run build`

Scripts de qualité disponibles dans ce repo:

- `npm run lint` n’existe pas
- `npm run typecheck` n’existe pas
- `npm test` n’existe pas

## 23. Résultat du build

- `npm run build` a été lancé plusieurs fois.
- Le build a passé le démarrage Next.js, puis est resté silencieux trop longtemps dans la phase de compilation.
- J’ai stoppé proprement le processus pour éviter un worker bloqué et un lock `.next` persistant.
- Conclusion honnête: build non confirmé dans cet environnement de validation, aucune erreur de TypeScript n’a été exposée avant l’arrêt.

## 24. Limites connues

- Les migrations SQL n’ont pas été appliquées sur une base distante.
- Les validations des fichiers SQL restent à exécuter dans l’environnement Supabase choisi par le projet.
- La Phase 3 UI métier n’est pas commencée.
- Les tables et helpers sont prêts pour l’extension, mais pas encore reliés à des écrans CRUD complets.

## 25. Risques avant production

- Vérifier l’exécution réelle des migrations sur l’instance Supabase utilisée par le projet.
- Vérifier les politiques RLS dans le contexte exact d’auth/session du repo.
- Vérifier que le build local ne reste pas bloqué sur ce workspace lors d’une prochaine exécution.
- Valider les droits effectifs des rôles seedés avant exposition à des utilisateurs réels.

## 26. Prochaine étape recommandée

Prompt Phase 3 recommandé:

- Construire la structure d’administration du produit ANGELCARE 360 COMMAND CENTER, en commençant par `Établissements`, `Années scolaires`, `Classes`, `Sections`, `Matières`, `Paramètres`, `Rôles & permissions`, avec pages réelles, actions contrôlées, lecture serveur sécurisée et journalisation d’audit.

