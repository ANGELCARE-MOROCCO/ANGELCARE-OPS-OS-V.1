# AC CAPITAL OS MZ13 — Import Verifier False-Positive Fix

Your import path patch applied correctly, but the verifier failed because it checked:

`content.includes("../../../../../lib/...")`

The corrected path is:

`../../../../../../lib/...`

The old 5-level path is a substring of the corrected 6-level path, so the verifier produced a false failure.

This patch changes the verifier to extract the import path and compare it exactly.

## Touched file

`AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01/scripts/verify_mz13_nested_api_import_path_fix.mjs`

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MZ13_IMPORT_VERIFIER_FALSE_POSITIVE_FIX.zip -d .

node ./AC_CAPITAL_OS_MZ13_IMPORT_VERIFIER_FIX_02/scripts/apply_import_verifier_false_positive_fix.mjs

node ./AC_CAPITAL_OS_MZ13_IMPORT_VERIFIER_FIX_02/scripts/verify_import_verifier_false_positive_fix.mjs

node ./AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01/scripts/verify_mz13_nested_api_import_path_fix.mjs
```

Then TypeScript:

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web

npx tsc -p tsconfig.json --noEmit --pretty false
```
