# Revenue OS — route ownership matrix

Audit réalisé le 26 juillet 2026 dans `app/(protected)/revenue-command-os`, `lib/revenue-command-os`, les composants Revenue OS et `scripts/revenue-command-os`.

| Élément de navigation | Href canonique | Page / propriétaire | Finalité opérationnelle | Actions et surfaces conservées | Source / vérité | Risque visuel traité |
|---|---|---|---|---|---|---|
| Cockpit exécutif | `/revenue-command-os/cockpit` | `cockpit/page.tsx` → `PremiumRevenueCockpit` | Posture exécutive, décisions, risques, exécution | Brief, intervention, approbations, exports, tableaux | Cockpit read-model | Hero trop cinématique, densité et prochaine action |
| Mega Production | `/revenue-command-os/mega-production` | `MegaProductionConsole` | Observabilité, apprentissage, activation réversible | Workers, files, expériences, kill switch, registres | Mega-production read-model | Hiérarchie technique / lisibilité |
| Jumeau commercial | `/revenue-command-os/digital-twin` | `DigitalTwinWorkspace` + `SovereignTwinExperience` | Offres, segments, territoires, capacité, dépendances | 14 sections, tiroirs d’entités, mutations gouvernées | Digital Twin repository | Corps spécialisé préservé |
| Objectifs revenus | `/revenue-command-os/revenue-objectives` | `RevenueOsWorkspacePage` → `MandateLedger` | Registre des mandats et lancement contrôlé | Composer, CSV `mandates`, sélection, lancement | Foundation repository | Empty state et action upstream |
| Signaux | `/revenue-command-os/signals` | `SignalFabricWorkspace` + `SovereignSignalExperience` | Ingestion, fraîcheur, classification et validation | 12 sections, `SignalDrawer`, scans, validation | Signal Fabric repository | État truthful / navigation imbriquée |
| Gemini & ressources | `/revenue-command-os/gemini-resources` | `GeminiResourcesWorkspace` | Modèles, ressources, contexte, prompts, runs | Registre, import, sélection, run, audit | Gemini resources APIs | Distinction ressource/contexte/outillage |
| Stratégies | `/revenue-command-os/strategy-engine` | `StrategyEnginePage` | Stratégies concurrentes et hypothèses | Génération, retry/cancel, evidence rail, Council/Studio | Operational read-model + Gemini | Éviter la composition décorative vide |
| Conseil stratégique | `/revenue-command-os/validation-council` | `CouncilWorkspace` | Revue indépendante et contradictions | 10 positions, run, résolution, preuves | Council APIs | Dossier institutionnel vs cercles décoratifs |
| Studio de décision | `/revenue-command-os/strategy-studio` | `StrategyStudioWorkspace` | Comparaison, simulation, note et décision | Approve/reject/amend/combine/export, drawers | Strategy Studio APIs | Comparaison board-grade |
| Commandes 3000 | `/revenue-command-os/command-kernel` | `CommandKernelWorkspace` + experiences | Registre canonique, éligibilité, routage, versions | Catalogue, simulation, runs, import CSV, guardrails | Command Kernel repository | Commandes restaurées et uniques |
| Programmes | `/revenue-command-os/active-programs` | `ProgramTerrain` | Portefeuille, valeur, propriétaire, blocages | Dossiers et actions de progression | Foundation operations | Cartes de portefeuille lisibles |
| Missions | `/revenue-command-os/compiled-missions` | `MissionBinders` | Mission, tâches, preuves et prochaine action | Compilation link, mission dossier, progression | Foundation operations | Densité opérationnelle |
| Email Studio | `/revenue-command-os/email-studio` | `RevenueEmailStudio` | Email OS assigné, brouillons et outbox | Gate Email OS, drafts, envois, tracking | Email OS APIs | Gmail direct reste désactivé |
| Validations | `/revenue-command-os/approvals` | `ApprovalCenterWorkspace` | Autorité humaine avant effet sensible | Approve/reject/correct, preuves, audit | Approval repository | Action footer et statut |
| Exceptions | `/revenue-command-os/exceptions` | `InterventionTower` | Blocages, contradictions et récupération | Diagnostics, routes upstream, kill-switch posture | Checks + operations model | Criticité et recovery action |
| Doctrine & mémoire | `/revenue-command-os/memory-learning` | `KnowledgeMemoryWorkspace` + experiences | Doctrine, preuves, versions, conflits | 12 sections, `DoctrineDrawer`, CSV, validation | Knowledge memory repository | Versioning et provenance |
| Audit | `/revenue-command-os/audit` | `ForensicLedger` | Timeline forensique et traçabilité | Event trace, acteur, résultat, audit links | Audit events | Timeline sans clutter technique primaire |
| Paramètres | `/revenue-command-os/settings` | `GovernanceConstitution` | Gouvernance, adaptateurs et frontières d’exécution | Flags, permissions, Email OS, WhatsApp/Calendar policy | Foundation + governance | Surface sombre explicitement contrastée |

## Routes imbriquées auditées

- Digital Twin : `overview`, `business-units`, `offers-services`, `bundles-combinations`, `customer-segments`, `decision-makers`, `markets-territories`, `channels-journeys`, `pricing-margins`, `capacity-constraints`, `seasonality`, `expansion-renewal`, `revenue-dependencies`, `model-validation`.
- Signaux : `overview`, `live-stream`, `source-control`, `source-health`, `classification`, `deduplication`, `scheduled-scans`, `context-snapshots`, `stale-data`, `subscriptions`, `data-access`, `model-validation`.
- Command Kernel : `overview`, `catalogue`, `taxonomy`, `routing`, `triggers`, `schedules`, `graphs`, `simulation`, `runs`, `versions`, `guardrails`, `validation`.
- Doctrine & mémoire : `overview`, `doctrine-library`, `knowledge-assets`, `rules-restrictions`, `scripts-objections`, `cases-patterns`, `playbooks-sops`, `approval-desk`, `conflict-resolver`, `versions-provenance`, `indexing-readiness`, `memory-validation`.

## Aliases et garde-fous

`intelligent-commands`, `commands`, `strategies`, `council`, `studio`, `compiler`, `execution`, `programs`, `missions`, `validations`, `memory`, `parameters` et `objectives` redirigent explicitement vers leur destination canonique dans `[workspace]/page.tsx`. Une destination inconnue appelle `notFound()`; elle n’est pas silencieusement mappée vers Strategy.
