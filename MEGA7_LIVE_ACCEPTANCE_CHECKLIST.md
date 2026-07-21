# Mega ZIP 7 Live Production Acceptance

## Installation and identity

- [ ] Private extension 0.7.0 installs with the approved stable identity.
- [ ] Pairing succeeds only once and replay is denied.
- [ ] Device appears in `/browser-os-production`.
- [ ] User receives only assigned modules and capabilities.

## Security

- [ ] Invalid and expired tokens are denied.
- [ ] Revoked device is denied.
- [ ] Stale capability version is denied.
- [ ] Unauthorized territory/account/approval is denied.
- [ ] Duplicate command replay returns the original governed result.
- [ ] Sensitive page content is absent from technical telemetry.

## Reliability and performance

- [ ] Offline state is visible and truthful.
- [ ] Partial hydration keeps successful sections available.
- [ ] Service-worker suspension recovery succeeds.
- [ ] Adapter failure does not crash the extension.
- [ ] Account, Partner and Management p95 budgets are measured.
- [ ] Error fingerprints and adapter health arrive in the cockpit.

## Release governance

- [ ] Internal channel works.
- [ ] Pilot rollout is capped.
- [ ] Known-bad version blocking works.
- [ ] Feature flag changes are audited.
- [ ] Scoped kill switch blocks the intended runtime only.
- [ ] Emergency rollback to 0.6.0 is rehearsed.

## Complete commercial journey

- [ ] Install → pair → assign → recognize → prospect → enrich.
- [ ] Opportunity → outreach → meeting → proposal → pricing → negotiation.
- [ ] Contract gate → payment verification → handoff → activation.
- [ ] First service → hypercare → performance → growth → renewal.
- [ ] AI Director → forecast → executive report.
- [ ] Device revocation clears capability state and denies subsequent commands.
- [ ] Complete audit history is available.

## Stable approval

- [ ] No unresolved SEV-1 or SEV-2 security/data-integrity incident.
- [ ] Performance budgets accepted.
- [ ] Rollback verified.
- [ ] Documentation accepted.
- [ ] Executive stable-release approval recorded.
