# True Live Enterprise Execution Checklist

## Must be done manually
- Add Supabase env vars
- Review and run SQL migration
- Replace placeholder auth resolver with your real session/auth
- Confirm RLS policy logic
- Test API routes locally
- Test audit writes
- Test AI server-only route
- Test publishing queue manually
- Test realtime event insert
- Run Vercel deployment build

## Run
```bash
npm run build
node scripts/content-command/env-check.mjs
node scripts/content-command/production-qa-checklist.mjs
```