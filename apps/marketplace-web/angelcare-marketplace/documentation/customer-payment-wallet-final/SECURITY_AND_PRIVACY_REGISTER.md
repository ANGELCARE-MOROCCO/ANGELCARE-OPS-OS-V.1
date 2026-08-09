# Security & Privacy Register

- Public customer auth is separate from employee login.
- Service-role operations stay server-side.
- Customer ownership and organization membership are revalidated on APIs.
- Wallet balance and discounts are server calculated.
- Ledger is immutable; corrections are compensating entries.
- Payment webhooks require HMAC signature and replay protection.
- Raw card credentials are not stored.
- Customer, family, organization, territory and tenant isolation require negative tests.
- Personalization and policy targeting must follow documented purpose, retention and customer rights.
