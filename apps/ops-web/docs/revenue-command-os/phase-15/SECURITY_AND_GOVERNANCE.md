# Security and Governance

All MZ15 tables use RLS, revoke anon/authenticated access, and grant server-side service-role access. Cockpit permissions are additive. The cockpit cannot approve, price, send, contract, release payment or bypass adapter controls. External actions remain disabled at the installation registry level.
