# KidFlix international finalization · 2026-10-20

This is a source-only delivery for `apps/marketplace-web`. It contains the implemented public KidFlix experience, native editor integration, 67 original illustrated compositions, 51 mobile exports, optimized official-logo derivative, verification tools and guarded source installer.

From the directory containing the extracted package, run one command with Node.js 20 or newer:

```sh
node ./ANGELCARE_KIDFLIX_INTERNATIONAL_FINALIZATION_20261020/install.mjs /absolute/path/to/angelcare-platform
```

The repository must match the supplied four-part baseline. Use canonical physical paths without symlinks. The working checkout used for implementation already contains the changes; apply this guarded installer to a baseline checkout. An unreceipted existing after-state is refused rather than given invented rollback history. The installer checks application identity, all payload hashes, original source hashes, collisions and symlinks before modifying files. It backs up original bytes beside the extracted package, stages writes and verifies installed hashes. It prints `BACKUP_ID` and the exact rollback command. Keep this extracted package and its `backups/` folder together.

To verify installed bytes:

```sh
node ./ANGELCARE_KIDFLIX_INTERNATIONAL_FINALIZATION_20261020/verify.mjs /absolute/path/to/angelcare-platform
```

Use the exact rollback command printed by installation. Rollback preflights every target and refuses later edits. There is no force option. Installation does not build, publish content, migrate data, deploy, or make Git changes. The subsequent release route remains GitHub Actions → GHCR → Coolify.

Read `OPERATOR_GUIDE.md`, `VERIFICATION.md`, `KNOWN_LIMITATIONS.md`, `contract-ledger.json`, `scope-manifest.json`, `payload-manifest.json` and `asset-register.json`. `HOMEPAGE_PREVIEW_DESKTOP.png` is the actual-component homepage capture. Additional full-page mobile, storefront, RTL and artwork evidence is in `evidence/`.

The final archive SHA-256 and its fresh-extraction test result are supplied in `ZIP_VALIDATION.json` beside the ZIP. The package contains the prior archive round-trip evidence in `evidence/zip-roundtrip-candidate.json`; the final archive is independently validated again after sealing.
