# Browser OS Administrator Handbook

## Authority
Only authorized extension administrators may manage devices, release channels, feature flags, kill switches, incidents, access assignments and revocation. `/users/[id]` remains the source of user capability truth. `/browser-os-production` is the production control surface.

## Daily checks
Review degraded devices, open incidents, active kill switches, adapter failures, version adoption and permission-denial spikes. Never promote a release with an unresolved SEV-1/SEV-2 security or data-integrity incident.

## Critical procedures
1. Revoke a lost device and all refresh tokens.
2. Activate a scoped kill switch before broad shutdown.
3. Roll back pilot before stable.
4. Preserve incident evidence without storing page content, credentials or message bodies.
