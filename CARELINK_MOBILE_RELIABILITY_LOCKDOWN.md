# CARELINK MOBILE RELIABILITY LOCKDOWN

Scope: audit/gate only. No UI redesign, no database migration, no workflow expansion.

## Reliability rule

Every mobile page must respect:

OPS source → mobile view → mobile action → API endpoint → DB persistence → OPS visibility → mobile refreshed result → audit trail.

## Locked mobile routes

- `/carelink`
- `/carelink/login`
- `/carelink/missions`
- `/carelink/missions/[id]`
- `/carelink/schedule`
- `/carelink/calendar`
- `/carelink/messages`
- `/carelink/notifications`
- `/carelink/alerts`
- `/carelink/history`
- `/carelink/payments`
- `/carelink/readiness`
- `/carelink/support`
- `/carelink/profile`
- `/carelink/safety`
- `/carelink/offline`

## Audit command

`npm run carelink:mobile-reliability`

This first lockdown pass is intentionally manual. It is not wired into `carelink:deploy-gate` yet, because the point is to expose real gaps before blocking deployments.

## What the audit checks

- all mobile routes exist
- core mobile shell files exist
- mobile workspace contract exposes notifications, messages, payments, readiness, availability, presence, report corrections, SOS events
- notification, alert, message, payment, readiness, support, profile, SOS and availability API routes exist
- mission action API routes exist for all mobile execution actions
- major mobile close-cycles have view + action + API tokens
- OPS visibility routes exist for mobile-originated records
- warns on empty handlers, dead links, or unfinished markers

## Initial findings from the uploaded emergency ZIP

The first static pass detected real close-cycle risks that need a follow-up repair phase:

1. Messages page sends to `/api/carelink/messages`, but the mobile UI does not clearly append/refresh the local message feed after send.
2. Readiness document workflow uses document submission/review paths, but the reliability mapping needs a strict close-cycle check for submission + review request.
3. Profile page correction workflow is present, but document upload/review visibility must be verified against the enterprise profile page and linked API routes.

## Next strict repair phase

`CARELINK MOBILE RELIABILITY LOCKDOWN — R1`

Only repair the gaps found by the audit:
- message send/read thread close-cycle
- readiness document submit/review close-cycle
- profile documents/corrections close-cycle
- notification destination mapping

No unrelated UI redesign, no OPS redesign, no new modules.
