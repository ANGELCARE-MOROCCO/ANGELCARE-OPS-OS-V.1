# Revenue Execution Phase 4 — Route Acceptance Ledger

| Route | Experience contract | Dominant UX | Operational purpose |
|---|---|---|---|
| `/revenue-command-center/daily-desk` | `daily-desk` | Executive daily command | Rank today's commitments by urgency, value and dependency |
| `/revenue-command-center/daily-tasks` | `daily-command` | Mission control | Control daily production, approvals and end-of-day posture |
| `/revenue-command-center/daily-tasks/[id]` | `daily-task-dossier` | Operational dossier | Preserve objective, owner, evidence and decisions |
| `/revenue-command-center/daily-tasks/agents` | `team-command` | Capacity command | Detect overload and unassigned work |
| `/revenue-command-center/daily-tasks/analytics` | `execution-analytics` | Performance cockpit | Measure throughput, delay, blockage and closure quality |
| `/revenue-command-center/daily-tasks/approvals` | `daily-approvals` | Decision desk | Review evidence and daily business consequences |
| `/revenue-command-center/daily-tasks/blocked` | `daily-blocked` | Recovery command | Resolve work that exposes commercial value |
| `/revenue-command-center/daily-tasks/board` | `daily-board` | Controlled flow | Visualize stage movement without bypassing server rules |
| `/revenue-command-center/daily-tasks/calendar` | `execution-calendar` | Planning horizon | Prevent deadline congestion |
| `/revenue-command-center/daily-tasks/focus` | `focus-mode` | Focus queue | Isolate the next critical mission |
| `/revenue-command-center/daily-tasks/list` | `daily-registry` | Dense registry | Search and administer daily commitments |
| `/revenue-command-center/daily-tasks/new` | `daily-create` | Mission studio | Create a governed daily commitment |
| `/revenue-command-center/my-work` | `my-work` | Personal queue | Concentrate owned and collaborative work |
| `/revenue-command-center/tasks` | `task-command` | Enterprise control plane | Control the complete task portfolio |
| `/revenue-command-center/tasks/[id]` | `task-dossier` | Full dossier | Maintain one operational source of truth |
| `/revenue-command-center/tasks/approvals` | `task-approvals` | Approval council | Make auditable approval decisions |
| `/revenue-command-center/tasks/blocked` | `task-blocked` | Revenue protection | Resolve blockers and escalation paths |
| `/revenue-command-center/tasks/board` | `task-board` | Controlled workflow | Visualize valid state movement |
| `/revenue-command-center/tasks/new` | `task-create` | Action studio | Transform an objective into verifiable work |
| `/revenue-command-center/workload-balancer` | `workload-balancer` | Capacity intelligence | Balance workload before commitments fail |
| `/revenue-command-center/activity-timeline` | `activity-timeline` | Immutable timeline | Explain who did what, when and with what result |

## Acceptance states included

Each route receives loading, empty, filtered-empty, API failure, mutation failure, stale-data disclosure and responsive transformations. The two dossier routes expose dependencies, checklist, evidence, approvals, blockers, comments and audit context. Creation routes use dedicated full-page studios rather than generic dialogs.
