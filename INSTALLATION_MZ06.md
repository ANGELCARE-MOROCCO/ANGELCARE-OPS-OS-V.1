# MZ06 installation

```bash
bash "$HOME/Downloads/apply_revenue_os_mz06.sh"   "/Users/user/Desktop/angelcare-platform"   "$HOME/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ06_GOLDEN_300.zip"
```

Apply manually afterward:

`apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql`

Verification:

```bash
cd "/Users/user/Desktop/angelcare-platform"
npm run revenue-os:phase06:typecheck
npm run revenue-os:phase06:verify
npm run revenue-os:phase06:test
npm run revenue-os:phase06:typecheck:integration
```

The installer never applies SQL, stages Git, commits Git or runs `npm run build`.
