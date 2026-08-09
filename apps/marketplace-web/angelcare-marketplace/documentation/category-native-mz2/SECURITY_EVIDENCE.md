# Security Evidence

All database mutation and continuity records are service-role-only behind server APIs. Public requests are schema-validated. Sessions are scoped by a hashed visitor reference and idempotency key. Direct `anon` and `authenticated` access to MZ2 transaction tables is revoked. Existing Family, Tenant, CRM, Provider, Finance, Inventory, Academy and Journey authorities remain canonical.
