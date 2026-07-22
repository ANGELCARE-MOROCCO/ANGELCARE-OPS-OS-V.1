# Security and Governance MZ12

- Supabase RLS enabled on every MZ12 table.
- `anon` and `authenticated` database grants revoked.
- Database access restricted to controlled service-side operations.
- Decision and memo-version rows are immutable through database triggers.
- Strategy approval is human only.
- Approval targets an exact strategy version.
- Conditions are machine-readable.
- External actions, mission compilation, sending, contracting and payment authority remain disabled.
