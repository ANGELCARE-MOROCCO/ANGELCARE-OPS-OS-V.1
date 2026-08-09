# Security and governance

All MZ13 tables use RLS. `anon` and `authenticated` grants are revoked; service-side access is granted to `service_role`. External action columns are constrained to zero. Versions and audit records are immutable. MZ13 cannot send email or WhatsApp, place calls, commit price, apply discount, sign contracts, release payments or propagate to operational modules.
