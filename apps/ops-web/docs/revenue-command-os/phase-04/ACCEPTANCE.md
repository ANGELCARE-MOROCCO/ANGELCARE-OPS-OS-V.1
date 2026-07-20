# Acceptance gate

MZ04 is accepted when:
- MZ01–MZ03 regression suites pass.
- All 15 source adapters are registered and allow-listed.
- Raw events are minimized, hashed and duplicate-safe.
- Signals expose source, category, type, severity, confidence, priority, opportunity, urgency and risk.
- Source scans are bounded, incremental and audited.
- Source health and stale-data controls are visible.
- Context snapshots separate facts from hypotheses and carry redaction data.
- No external model or messaging action exists.
- All MZ04 tables have RLS, service-only access and rollback coverage.
- The premium twelve-workspace Signal Fabric UI is operational.
