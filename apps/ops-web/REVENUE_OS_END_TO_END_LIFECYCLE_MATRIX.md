# Revenue OS End-to-End Lifecycle Matrix

| Lifecycle | Entry | Direct operations | Persisted outcome | Recovery |
|---|---|---|---|---|
| Mandate | Manual/CSV | Create, edit, launch, pause, complete, reopen | Objective + Strategy Assembly run | Retry or edit context |
| Gemini | Mandate/resources | Run, force fresh request, inspect provider result | AI job, attempts, strategies, usage | Explicit technical retry |
| Strategy | Strategy Engine/Studio | Generate, rank, amend, combine, publish, compile | Strategy versions + direct decision | Reanalyse or reopen |
| Council | Strategy | Run agents, resolve disagreement, continue immediately | Findings and audit | Retry failed agent |
| Commands | Manual/CSV/schedule | Import, select exact code, execute live | Run plan, command runs, structured output | Retry/fallback |
| Compiler | Strategy | Inspect, compile and publish | Programs, missions, tasks, scripts, propagation | Recompile/rollback internal artifacts |
| Programs | Compiler/manual operations | Activate, pause, resume, close, reopen | Program status + payload history | Reopen/reassign |
| Missions | Compiler/manual operations | Start, pause, resume, complete, reopen | Mission/task status + evidence | Retry/reopen |
| Execution | Propagation package | Prepare+activate, pause, resume, cancel, retry | Run/actions/outbox/provider results | Dead-letter retry/compensation |
| Email | Email Studio | Draft, send, schedule, follow up | Email OS result + Revenue audit | Retry/corrective follow-up |
| WhatsApp | Existing channel | Enable/disable, prepare, send, retry | Provider result + Revenue audit | Retry/corrective message |
| Exceptions | Diagnostics/action failure | Create dossier, assign, retry, resolve, reopen | Operational exception + audit | Reopen or replace operation |
| Audit | Automatic | Search, inspect, export | Immutable trace | Not applicable |
