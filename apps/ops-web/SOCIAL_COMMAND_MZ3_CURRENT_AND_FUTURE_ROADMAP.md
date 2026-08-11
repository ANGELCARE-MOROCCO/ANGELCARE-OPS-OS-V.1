# Social Command · Current and Future Roadmap after MZ3 Core

MZ3 Core closes the immediate production-hardening gaps that can be solved safely without changing the current database topology. The following are intentionally future migrations rather than silent changes inside this patch.

## Next architecture migrations

### Multi-tenant / multi-brand Meta topology
The current schema intentionally permits one connected Meta estate. A global SaaS conversion requires tenant/brand ownership columns, tenant-scoped uniqueness, tenant-aware RLS/RBAC, per-tenant webhook routing and provider credentials. This must be a dedicated migration, not an in-place assumption.

### Full webhook dead-letter operations
MZ3 replays failed signature-verified events. Rejected events deliberately do not persist raw bodies. A future DLQ can add encrypted/quarantined payload retention with explicit privacy retention and operator approval.

### Media pipeline expansion
- resumable/chunked large-video uploads;
- ffprobe/codec validation;
- thumbnails and previews;
- optional malware/content scanning;
- orphan reconciliation and archival policy;
- capacity forecasting and quota policy.

### Provider lifecycle
- proactive token renewal/reconnect workflow;
- explicit permission/version drift catalogue;
- App Review/Advanced Access readiness dashboard;
- provider-error taxonomy and remediation playbooks.

### Engagement expansion
- Facebook Page engagement adapter when the required Meta permission envelope is stable;
- reaction/edit/referral/handover webhook normalization only when corresponding product workflows exist;
- SLA routing, assignment and escalation policies.

### Governance
- formal data-retention policy for conversations/comments/mentions/webhook evidence;
- DSAR/export/delete workflows;
- tenant-aware audit export;
- secrets rotation ceremony and periodic security verification.

### Facebook Story
Remain unsupported until Meta provides a verified, production-safe Page Story publishing adapter for the exact AngelCare integration. The product must continue to show unsupported rather than fabricate capability.
