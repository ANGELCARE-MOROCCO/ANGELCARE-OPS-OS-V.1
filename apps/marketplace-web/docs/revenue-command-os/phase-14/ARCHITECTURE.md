# Architecture

1. Validate immutable MZ13 package and active MZ12 approval.
2. Map compiled tasks to universal execution actions.
3. Persist action and outbox intent with idempotency.
4. Lease actions through workers.
5. Revalidate approval, adapter health, credentials, capacity and execution mode.
6. Execute, retry, dead-letter, compensate and reconcile webhook outcomes.
