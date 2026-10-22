# Executed verification · final source and assets

All commands below completed against the final implementation. No production build, live SQL, migration, publication, deployment, container or Git mutation was performed.

| Check | Actual result | Evidence |
|---|---|---|
| Four source archives | SHA-256 recorded; identical packing-report overlaps reconciled; zero contradictory duplicates; unsafe out-of-scope names quarantined | `archive-audit.json` |
| Source boundary | 149 payload files: 18 existing files changed, 131 new files; zero unmanifested baseline changes; all NEW targets absent from source archives | `scope-manifest.json`, `payload-manifest.json`, `evidence/scope-reconciliation.json` |
| DCE exception | Exactly two added dispatch lines for authorized homepage preview; other repository commands retained | `evidence/dce-dispatch.diff` |
| Scoped TypeScript | PASS: 81 KidFlix root files, 928 files including transitive dependencies, zero diagnostics | `evidence/typescript.log` |
| Model and native command services | PASS: 126 executed offline checks | `evidence/behavior.log` |
| Browser | PASS: 329 checks, zero failures: 306 world/language/viewport render cases plus 23 interaction cases | `evidence/browser-results.json` |
| Editorial assets | PASS: 67 distinct original compositions, 51 hero mobile exports, all dimensions/sizes/SHA-256 recorded; no duplicate desktop bytes; visual inspection completed | `asset-register.json`, `evidence/artwork/` |
| Installer | PASS: ten scenarios, including the complete install/verify/idempotence/rollback path and exact baseline restoration | `evidence/installer-results.json`, `evidence/installer.log` |
| ZIP | Fresh extraction, integrity and payload hashing, then shipped installer/verification/rollback against baseline fixtures | `evidence/zip-roundtrip-candidate.json` and the delivered `ZIP_VALIDATION.json` sidecar |

Executed project commands:

```sh
node scripts/kidflix-finalization/check-types.cjs
node scripts/kidflix-finalization/verify-behavior.cjs
node scripts/kidflix-finalization/preview.cjs
node scripts/kidflix-finalization/browser.cjs
node scripts/kidflix-finalization/delivery/test-installer.mjs /private/tmp/kidflix-finalization-20261020/baseline/angelcare-platform
```

The preview uses webpack development-mode transpilation of the actual components into a temporary verification directory. This is not a Next production build. Browser automation ran in Chromium on localhost and was permitted outside the sandbox because the sandbox denied browser launch and port binding. It did not read private environment files or contact a live database.

The 306 rendering cases cover the homepage and all sixteen storefronts in English, French and Arabic at 360, 390, 768, 1024, 1440 and 1920 CSS pixels. Every captured page was checked for loaded images, required controls, RTL direction and horizontal overflow. Lazy images were explicitly loaded and decoded before screenshots.

Seven supplemental navigation exclusion checks also passed for external origins, downloads, new tabs, unrelated targets, mailto links, links outside KidFlix and modified clicks. See `evidence/navigation-exclusions.json`.

The 23 browser interaction cases cover gallery timing, hover/focus and manual pause, six-scene mobile controls and keyboard input, initial/next-image failures, mobile fallback, reduced motion, off-screen and simulated background-document visibility, stale image completion, selective gallery fetching, six native discovery choices, query/locale preservation, menu keyboard recovery, navigation lifecycle/slow/error/dismissal, real media-element event feedback, absent media, retained results after API failure, localized route loading/error retry, and both native editors' save/reload/preview. Background visibility and media events were controlled locally; this does not claim production network streaming success.

Offline command adapters exercise the actual normalization and command services, including language-specific reviewed hashes, permissions invoked through the existing authority boundary, native image URL matching, retained references across live/draft editions, legacy/custom artwork preservation and existing catalogue preview RPCs. They never execute live database writes.

Installer scenarios cover successful installation, shipped verification, identical reapplication, source conflict, new-file collision, corrupt payload, unsafe path and symlink target/ancestor, simulated partial write failure, concurrent-change detection, successful rollback, later-edit rollback refusal and identity mismatch. Ten named scenarios group these related operations. The final ZIP is tested again after extraction using its own shipped scripts; the sidecar binds that result to the final archive SHA-256.
