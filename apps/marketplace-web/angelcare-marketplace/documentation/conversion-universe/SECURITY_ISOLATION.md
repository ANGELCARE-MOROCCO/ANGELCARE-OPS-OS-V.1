# Security and isolation

- New tables enable RLS, revoke direct `anon`/`authenticated` table access and grant only `service_role`.
- Public APIs do not trust client-provided user IDs as authorization. Visitor-bound access requires a hashed browser reference and session/basket identity.
- Backoffice routes and APIs enforce canonical Marketplace permissions and territory/tenant context.
- Idempotency keys prevent duplicate session and outcome creation.
- Consent text hashes and price source hashes preserve evidence without exposing secrets.
- No child-sensitive data is written to analytics events.
