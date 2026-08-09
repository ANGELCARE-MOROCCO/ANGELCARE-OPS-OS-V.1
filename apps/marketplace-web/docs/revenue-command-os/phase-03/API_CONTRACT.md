# API contract

Endpoint: `/api/revenue-command-os/knowledge-memory`

## GET
Returns the complete permission-filtered doctrine bootstrap and warnings. Cache is disabled.

## POST allow-list

- `mutate_doctrine`: create, update or move a doctrine through its lifecycle.
- `decide_approval`: approve, reject, request changes or cancel a dossier.
- `resolve_conflict`: resolve, accept risk, dismiss or review a conflict.
- `queue_index`: create a controlled local indexing job.
- `run_validation`: calculate and persist model validation findings.
- `update_validation_status`: acknowledge, resolve, waive or reopen a finding.

Approval, activation, suspension, retirement and conflict resolution require approval authority. Inputs are narrowed through explicit schemas and field allow-lists. No external communications or strategy execution endpoints are present.
