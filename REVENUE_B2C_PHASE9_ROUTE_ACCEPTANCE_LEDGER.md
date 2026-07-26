# Revenue B2C Phase 9 — Route Acceptance Ledger

| Route | Experience | Purpose-built title | Archetype | Status |
|---|---|---|---|---|
| `/revenue-command-center/b2c-workflow` | `b2c-command` | Commandement familles & conversion B2C | command | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]` | `family-dossier` | Dossier famille 360° | dossier | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]/care-start` | `family-care-start-dossier` | Autorité de démarrage de prise en charge | activation | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]/consultation` | `family-consultation-dossier` | Consultation famille & recommandation | studio | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]/intake` | `family-intake-dossier` | Intake famille contrôlé | studio | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]/matching` | `family-matching-dossier` | Matching caregiver-famille | studio | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]/onboarding` | `family-onboarding-dossier` | Onboarding & préparation opérationnelle | activation | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]/qualification` | `family-qualification-dossier` | Qualification besoins & faisabilité | governance | Rebuilt |
| `/revenue-command-center/b2c-workflow/[id]/quote` | `RevenueProposalWorkspace` | B2C quotation authority | studio | Preserved — Phase 6 |
| `/revenue-command-center/b2c-workflow/[id]/recovery` | `family-recovery-dossier` | Récupération relation famille | governance | Rebuilt |
| `/revenue-command-center/b2c-workflow/active-clients` | `active-families-command` | Portefeuille familles actives | portfolio | Rebuilt |
| `/revenue-command-center/b2c-workflow/analytics` | `b2c-analytics-command` | Performance conversion, activation & rétention | intelligence | Rebuilt |
| `/revenue-command-center/b2c-workflow/care-start` | `care-start-command` | Commandement démarrages de prise en charge | activation | Rebuilt |
| `/revenue-command-center/b2c-workflow/consultation` | `consultation-command` | Consultations familles & décisions | queue | Rebuilt |
| `/revenue-command-center/b2c-workflow/executive` | `b2c-executive-command` | Posture exécutive B2C | intelligence | Rebuilt |
| `/revenue-command-center/b2c-workflow/high-value` | `high-value-family-command` | Familles à forte valeur & haute exigence | portfolio | Rebuilt |
| `/revenue-command-center/b2c-workflow/intake` | `intake-command` | Nouveaux leads familles & première réponse | queue | Rebuilt |
| `/revenue-command-center/b2c-workflow/matching` | `matching-command` | Matching, disponibilité & décision famille | portfolio | Rebuilt |
| `/revenue-command-center/b2c-workflow/new` | `create-family-studio` | Créer un dossier famille sécurisé | studio | Rebuilt |
| `/revenue-command-center/b2c-workflow/onboarding` | `onboarding-command` | Onboarding, documents & readiness | activation | Rebuilt |
| `/revenue-command-center/b2c-workflow/pipeline` | `b2c-pipeline-command` | Pipeline familles de l’intake à l’activation | portfolio | Rebuilt |
| `/revenue-command-center/b2c-workflow/qualification` | `qualification-command` | Qualification, faisabilité & recommandation | queue | Rebuilt |
| `/revenue-command-center/b2c-workflow/quote` | `RevenueProposalWorkspace` | B2C quotation authority | studio | Preserved — Phase 6 |
| `/revenue-command-center/b2c-workflow/recovery` | `recovery-command` | Récupération, plaintes & protection relationnelle | governance | Rebuilt |
| `/revenue-command-center/b2c-workflow/retention` | `retention-command` | Rétention, extension & croissance famille | intelligence | Rebuilt |
| `/revenue-command-center/b2c-workflow/risk` | `b2c-risk-command` | Risques commerciaux, opérationnels & confiance | governance | Rebuilt |

## Acceptance rule

Each rebuilt route has a unique route contract, primary action, hierarchy and responsive composition. The two quotation routes intentionally remain on the Phase 6 Proposal authority to prevent a second quote engine.
