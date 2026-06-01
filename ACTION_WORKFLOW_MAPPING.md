# Observatory Action / Workflow Mapping

| UI Action | Workflow opened | Primary action button | Notes |
|---|---|---|---|
| Run All Probes | Probe scan workspace | Run Probe Scan | API/Supabase/modules/queues/incidents/audit/options/environment probes |
| Diagnostics | Diagnostic matrix workspace | Run Diagnostics | Passed/warning/failed with remediation and safety context |
| Sync Registry | Registry validation workspace | Validate & Sync Registry | Uses SaaS Factory module sync path |
| Export Observatory Snapshot | Export workspace | Download File | Real `/api/saas-factory/observatory/export?format=json` route |
| Health Domain card | Health domain review | Run Domain Diagnostics | Shows selected domain context and incident threshold |
| Probe row/detail | Probe evidence drawer | Reload Probe Evidence | Loads `/api/saas-factory/observatory/probes/[id]` |
| Queue View | Queue evidence workspace | Load Queue Evidence | Summary/backlog/failed job context |
| Retry Failed Jobs | Queue retry workspace | Retry Safe Failed Jobs | Safe-gated action endpoint |
| Purge Queue | Blocked destructive workflow | Audit Blocked Attempt | Disabled unless dedicated irreversible approval adapter exists |
| New From Probe / Create Incident | Incident creation workspace | Create Incident Draft | Captures title, severity, owner, linked evidence and note |
| Open Incident Summary | Incident summary workspace | Load Incident Timeline | Reads linked incident context where available |
| Audit Event | Audit evidence workspace | Load Audit Trail | Uses recent audit endpoint |
| Export Audit Logs | Export workspace | Download File | CSV export route |
| Recommendation Review | Remediation-plan workspace | Build Remediation Plan | Derived from failed probes/warnings/queues/incidents/readiness |
