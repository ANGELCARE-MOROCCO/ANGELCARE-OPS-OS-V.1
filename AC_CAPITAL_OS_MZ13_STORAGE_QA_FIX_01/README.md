# AC CAPITAL OS MZ13 — Storage QA Verifier Fix

This fixes the QA failure:

`FAIL: storage contract missing token: ac-capital-data-room`

The implementation was correct: the default bucket is centralized in:

`apps/ops-web/lib/ac-capital-os/server/feature-flags.ts`

and `storage.ts` consumes it through `flags.storageBucket`.

The original verifier was too rigid because it expected the literal bucket name only inside `storage.ts`.

## Touched file

`AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_storage_contract.mjs`

No app runtime file is changed.

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MZ13_STORAGE_QA_FIX.zip -d .

node ./AC_CAPITAL_OS_MZ13_STORAGE_QA_FIX_01/scripts/apply_mz13_storage_qa_fix.mjs

node ./AC_CAPITAL_OS_MZ13_STORAGE_QA_FIX_01/scripts/verify_mz13_storage_qa_fix.mjs

node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_storage_contract.mjs
```
