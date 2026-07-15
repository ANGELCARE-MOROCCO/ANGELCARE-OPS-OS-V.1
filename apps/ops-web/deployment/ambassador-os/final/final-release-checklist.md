# Ambassador OS Final Release Checklist

## Build
- [ ] npm run build passes
- [ ] no route import errors
- [ ] no duplicate component conflicts
- [ ] no env runtime crashes

## SQL
- [ ] enable extensions
- [ ] run schema
- [ ] run indexes
- [ ] adapt RLS to real role table
- [ ] run smoke tests

## APIs
- [ ] GET /api/ambassadors/final/health
- [ ] GET /api/ambassadors/final/profiles
- [ ] GET /api/ambassadors/final/missions
- [ ] GET /api/ambassadors/final/payouts
- [ ] POST high-risk routes remain blocked until RBAC is real

## Security
- [ ] payout approval server-validated
- [ ] compliance approval server-validated
- [ ] AI high-risk execution approval-gated
- [ ] audit logs persist high-risk actions
