# Acceptance

MZ14 is accepted when sixteen adapters and fifteen mandatory action types are present, MZ13 packages prepare idempotent actions, outbox/inbox controls pass, approval boundaries block unapproved external action, retries and dead letters work, rollback/compensation is recorded, webhooks reject invalid signatures, and cumulative MZ01–MZ13 checks remain valid.
