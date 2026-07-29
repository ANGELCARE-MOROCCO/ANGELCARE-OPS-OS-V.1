# MZ15 Final API Binding Matrix

| Domain | GET/read | Controlled writes |
|---|---|---|
| Command floor | `/api/ac-capital-os/command-floor` | coordinator mission, approval request, founder brief |
| Radar | `/capital-radar` | create, validate source, monitor, handoff; `/research/run` dry-run |
| Qualification | `/qualification-engine` | dossier, missing document, decision, next action |
| Funders | `/funder-intelligence` | funder, contact, relationship event, objection, narrative, follow-up |
| Doctrine | `/capital-doctrine` | doctrine/prompt/skill drafts, founder-controlled activation/rollback |
| Cases | `/case-builder` | case, sections, proof request, approval request, handover, founder lock |
| Data Room | `/data-room`, `/data-room/documents` | real multipart upload, classification, evidence request, package |
| Pipeline | `/capital-pipeline` | deal, stage, communication, follow-up, proof-controlled submission, negotiation, outcome |
| Coordinator | `/coordinator-cockpit` | email prepare, manual sent proof, call, complete task, escalation |
| AI | `/ai-command-center` | dry-run, issue report, pause, human queue; no live model by default |
| Strategy / Simulator | `/strategy-production-command` | scenarios, stress tests, persisted snapshots |
| Reports | `/reports/list` | `/reports/generate` API-generated markdown/HTML/JSON draft |
| Manual | `/strategy-production-command` | `/manual/progress` user checklist progress |
| Approvals | `/approvals` | `/approvals/[id]/decision` approve/reject/revision |
| Learning | `/learning` | capture and convert to doctrine draft |
| Settings | `/settings` | governed non-secret change request |
| Production | `/production-health` | blocker through strategy production command |
| Browser evidence | `/browser-acceptance` | optional persistence of authenticated browser results |

Every API returns the `ok`, `dataMode`, `source`, `warning`, and `data` truth envelope. No page is permitted to label fallback data as live.
