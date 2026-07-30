# Ambassador Data Lifecycle Action Acceptance Ledger

| Surface | Action | Contract |
|---|---|---|
| Vue de gouvernance | Search inventory | Filters real Ambassador, Candidate and Lead inventory |
| Vue de gouvernance | Select dossiers | Multi-selects governed entities for a future bulk job |
| Vue de gouvernance | Analyse | Calls the existing dependency preview RPC |
| Vue de gouvernance | Archive / Restore / Anonymize | Preserves existing lifecycle state actions |
| Vue de gouvernance | Demander suppression | Preserves the governed single-record request flow |
| Registre | Filter/search/status tabs | Keeps every lifecycle state distinct |
| Registre | Open dossier | Opens the purpose-built decision drawer |
| Registre | Approve / Reject | Available only for `requested` requests |
| Registre | Execute | Available only for `approved` requests |
| Registre | Rejected / Completed | Exposes no destructive action |
| Registre | Blocked | Exposes inspection, not a misleading execution command |
| Audit | Filter/classify | French operational classification without mutating raw payload |
| Audit | Open event | Opens immutable event evidence drawer |
| Bulk | Create job | Creates a governed bulk job; deletes nothing |
| Bulk | Preflight | Analyses every item and every active adapter |
| Bulk | Approve / Reject | Records a governed bulk decision |
| Bulk | Execute | Requires the exact bulk code and records each item result |
| Bulk | Retry partial/failed | Retries only eligible failed items |
| Policies | Authorities | Shows self-decision and self-execution authority flags |
| Policies | Adapter registry | Shows delete, detach, block and verify-only strategies |
