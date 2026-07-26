# Deduplication, Cache and Savings Report

## Fingerprint inputs

The central request fingerprint includes the module, workspace, capability, command, model policy, prompt version, source revision and normalized request payload. Actor identity and callback/runtime objects are deliberately excluded so equivalent work remains reusable.

## Duplicate handling

- A valid structured result returns `REUSE_CACHED`.
- A currently running equivalent request returns `JOIN_IN_FLIGHT`.
- Only the first equivalent request consumes provider budget.
- Stale in-flight requests are expired and their reservations released.

## Invalidation

Cache entries can expire or be invalidated with a reason. Material prompt, source, doctrine/resource or model policy changes alter the fingerprint and therefore do not silently reuse stale work. Forced refresh requires policy permission and a new reservation.

## Savings evidence

The ledger records avoided requests, avoided input/output tokens, avoided estimated provider cost, the original source request and the Revenue module/workspace/command receiving the reuse benefit.
