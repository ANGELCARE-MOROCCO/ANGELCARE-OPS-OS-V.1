# Payment State Register

`created → requires_method → requires_customer_action/pending → authorized → captured → reconciled`

Exception branches: `failed`, `cancelled`, `expired`, `partially_refunded`, `refunded`, `disputed`, `chargeback`, `reversed`, `reconciliation_pending`.

Customer copy must translate technical states. Provider callbacks are idempotent and persisted before processing.
