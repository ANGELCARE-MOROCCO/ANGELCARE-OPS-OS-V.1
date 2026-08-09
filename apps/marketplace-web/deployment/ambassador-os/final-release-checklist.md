# Ambassador OS Final Release Checklist

## Before deploy
- [ ] npm run build passes
- [ ] route smoke checklist reviewed
- [ ] duplicate-risk scan reviewed
- [ ] sidebar exposes only core routes
- [ ] Supabase migrations tested
- [ ] vector extension enabled
- [ ] RLS policies adapted to real role source
- [ ] API placeholders understood
- [ ] payout/compliance/AI approval blocked until server validation

## Deploy preview
- [ ] Vercel preview deploy passes
- [ ] no 404 on critical Ambassador routes
- [ ] no white screens
- [ ] no console runtime crashes
- [ ] no environment variable errors

## Production
- [ ] audit logging connected
- [ ] permissions enforced
- [ ] backup/rollback plan exists
- [ ] monitoring/logs available
