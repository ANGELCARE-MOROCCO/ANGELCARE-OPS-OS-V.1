# Mega ZIP 6 Migration Order

## Preconditions

- Mega ZIP 5 is installed and its SQL migration is already applied.
- Current accepted Browser OS version is `0.5.0`.
- The target repository and database are backed up.
- No Git staging, commit or push is required by this package.

## Execution order

1. Inject the source patch using `MEGA6_APPLIED_FILES.txt`.
2. Run `npm run browser-extension:contracts:verify`.
3. Run `npm run typecheck:extension`.
4. Apply:
   `apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_ai_sales_director.sql`
5. Deploy or restart the patched OPS web backend.
6. Build the extension:
   `npm --prefix apps/revenue-browser-extension run build`
7. Verify the extension:
   `npm --prefix apps/revenue-browser-extension run verify`
8. Open `/users/[id]` and assign only the required Mega ZIP 6 capabilities/submodules.
9. Refresh or re-pair the pilot user's Browser OS session so capability version `0.6.0` is loaded.
10. Execute `MEGA6_LIVE_ACCEPTANCE_CHECKLIST.md`.

## Verification commands

```bash
npm run browser-extension:contracts:verify
npm run typecheck:extension
npm run browser-extension:b2b-ai-sales-director:verify
npm run browser-extension:verify
```

In the fully installed OPS repository, also run its Browser OS or full TypeScript check after dependencies are installed.
