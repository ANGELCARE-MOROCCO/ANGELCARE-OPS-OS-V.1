# Revenue OS External Actions Contract

## Active action families

- Email through assigned Email OS mailboxes.
- WhatsApp through the existing manually controlled channel.
- Proposals, campaigns, meetings, opportunity updates, payments, assignments, training/delivery handoffs, reporting and internal tasks through internal adapters.

## Preserved channel policy

- Direct Gmail adapter remains disabled.
- Calendar remains disabled.
- WhatsApp enablement changes WhatsApp only.
- Email OS remains the authoritative mailbox and delivery provider.

## Technical integrity

- Externality is derived from canonical action type.
- Worker requires a signed request, valid lease, exact idempotency key and execution actor.
- Payload hash is recalculated before execution.
- Duplicate successful actions are not dispatched again.
- Email and WhatsApp compensation is described truthfully as suppression/corrective follow-up, never withdrawal of an already delivered message.
- Internal adapter destinations are checked by the full-repository production gate.
