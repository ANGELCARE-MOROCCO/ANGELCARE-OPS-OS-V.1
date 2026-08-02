# Operator guide

1. Open **Conversion Command** for active sessions and exception pulse.
2. Use Sessions for the full lifecycle queue.
3. Use Baskets for transactional/quotation composition and expiry.
4. Use Bookings, Enrollments and Quotations for journey-specific handovers.
5. Use Holds before expiry, Consents for evidence, and Exceptions for recovery.
6. Recovery requires `marketplace.conversion.recover`, a target status and a written reason; the action is audited.
7. Configuration policies control TTLs and required consent keys without source-code edits.
