# AC CAPITAL OS — Mega Ultra ZIP 01 Foundation Premium Shell

## Correct target

This package is explicitly targeted for the protected app route:

`apps/ops-web/app/(protected)/ac-capital-os/page.tsx`

The installer also places supporting files under:

- `apps/ops-web/components/ac-capital-os/`
- `apps/ops-web/lib/ac-capital-os/`
- `apps/ops-web/app/api/ac-capital-os/foundation/route.ts`
- `supabase/migrations/20260727_ac_capital_os_mz1_foundation.sql`

## Exact install commands

Run these from your repository root:

```bash
cd ~/Desktop/angelcare-platform
unzip -o AC_CAPITAL_OS_MEGA_ULTRA_ZIP_01_FOUNDATION_PREMIUM_SHELL_PROTECTED_TARGET_FIX.zip -d .
node ./AC_CAPITAL_OS_MZ1/scripts/apply_ac_capital_os_mz1.mjs
node ./AC_CAPITAL_OS_MZ1/scripts/verify_ac_capital_os_mz1.mjs
```

If you are already inside `apps/ops-web`, go back first:

```bash
cd ../..
```

## Important

Do not run the verifier before applying the patch.
Do not run build.
Do not stage, commit, or push.
After verification, run your normal static TypeScript check from `apps/ops-web`.

Expected verifier success:

`MZ1_AC_CAPITAL_OS_FOUNDATION_VERIFIED`
