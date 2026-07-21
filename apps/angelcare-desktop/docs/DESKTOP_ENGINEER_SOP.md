# ANGELCARE Desktop — Desktop Engineer SOP

**Release:** 1.4.0
**Contract:** Mega ZIP 5 / Desktop Contract 5.0.0
**Audience:** ANGELCARE desktop engineering, release engineering and authorized support staff

## 1. Purpose

This SOP defines the controlled engineering lifecycle for ANGELCARE Desktop: local development, verification, packaging, signing, notarization, update publication, release validation, rollback and incident support. It must be used together with the release checklist and validation workbook.

## 2. Repository boundaries

- Desktop runtime: `apps/angelcare-desktop`
- SaaS application: `apps/ops-web`
- Persistent WhatsApp profile: `persist:angelcare-whatsapp-main`
- WhatsApp profile contents must never be copied to another workstation, uploaded, archived in Git, or placed in a support bundle.
- `.env*`, certificates, private keys, signing passwords, Apple credentials and Windows signing credentials must never be committed.

## 3. Required engineering environment

- Node.js version compatible with the repository lockfile.
- npm available on the build runner.
- macOS runner for DMG signing and notarization.
- Windows runner for native Windows installer generation and Authenticode signing.
- Production SaaS reachable at `https://opsmanagement.angelcarehub.com`.
- Signing credentials exposed only through protected CI secrets or an authorized local keychain/certificate store.

## 4. Local development

From the repository root:

```bash
npm install
npm run desktop:dev
```

The development desktop loads `http://localhost:3000`. Do not point a development build at production unless explicitly testing production connectivity with a controlled account.

## 5. Mandatory pre-release verification

Run from the repository root:

```bash
npm run desktop:verify:cumulative
npm run desktop:verify:security
```

From `apps/angelcare-desktop`, also run:

```bash
npm run smoke:config
npm run signing:preflight
```

Release is blocked when any Mega ZIP 1–5 verifier or the runtime security smoke suite fails.

## 6. Version change procedure

1. Update `apps/angelcare-desktop/package.json`.
2. Update the top-level package metadata where required.
3. Update release notes and release manifest inputs.
4. Confirm Desktop Contract remains `5.0.0` unless a new signed contract exists.
5. Run cumulative verification.
6. Generate checksums only after artifacts are final.

Semantic versioning policy:

- Patch: security correction, runtime defect or documentation correction without contract expansion.
- Minor: backward-compatible capability expansion approved by ANGELCARE.
- Major: incompatible runtime, governance or data-contract change.

## 7. macOS packaging

On macOS:

```bash
npm run desktop:package:mac
```

Architecture-specific commands remain available under `apps/angelcare-desktop`.

For a trusted public build, provide protected environment variables required by the Forge signing/notarization configuration. The release engineer must verify:

```bash
codesign --verify --deep --strict --verbose=2 "ANGELCARE Desktop.app"
spctl --assess --type execute --verbose=4 "ANGELCARE Desktop.app"
```

Notarization must complete and the ticket must be stapled before distribution.

## 8. Windows packaging

On a Windows runner:

```powershell
npm run desktop:package:windows
```

A trusted public installer requires the ANGELCARE code-signing certificate or approved signing service. Verify the executable and installer signatures with Windows signature tooling before publication. Do not publish an unknown-publisher build as a trusted production installer.

## 9. Release manifest and checksums

After native artifacts are generated:

```bash
cd apps/angelcare-desktop
npm run release:checksums
npm run release:manifest
npm run release:verify
```

The manifest must identify version, build, channel, platform, architecture, URL, size and SHA-256. The update host must match the allowlist. Never use an arbitrary URL supplied by a remote command.

## 10. Update publication

1. Upload artifacts to the controlled ANGELCARE release location.
2. Upload checksums.
3. Publish the channel-specific manifest only after artifact verification.
4. Validate pilot channel first.
5. Confirm update detection, download, hash verification and restart-to-update.
6. Promote to stable only after pilot sign-off.
7. Preserve the previous approved installer and manifest for recovery.

## 11. Rollback

- Runtime rollback may restore a previous desktop binary or configuration.
- A server-side database migration is never claimed to be automatically rolled back by the desktop updater.
- Mega ZIP 5 adds no database migration.
- If startup repeatedly fails, collect sanitized diagnostics, preserve the local WhatsApp partition, and reinstall the previous approved desktop version.
- Clear the WhatsApp partition only when the security or linked-device SOP explicitly requires it.

## 12. Diagnostics and support

The production diagnostics export is intentionally sanitized. It may contain version, platform, runtime state, authorization state, crash metadata and redacted logs. It must not contain WhatsApp messages, cookies, IndexedDB, customer files, credentials or tokens.

Support workflow:

1. Record user, device installation ID, release and time of incident.
2. Export diagnostics from Session Control.
3. Review sanitized events.
4. Reproduce in a controlled environment.
5. Restart only the affected renderer when possible.
6. Use remote commands only from the strict command allowlist.
7. Record resolution and regression test.

## 13. Security incident handling

For a lost, stolen or compromised workstation:

1. Revoke assignments and authorization leases.
2. Block the installation ID.
3. Issue hide, logout and local-session-clear commands.
4. Remove the device from WhatsApp **Appareils connectés** using the primary phone.
5. Record evidence and close the security incident only after both local and phone-side removal are confirmed.

## 14. CI requirements

The release workflow must:

- install dependencies from the lockfile;
- run Mega ZIP 1–5 verification;
- run the security smoke suite;
- build only on the correct native runner;
- retrieve signing credentials from protected secrets;
- avoid printing credentials;
- generate deterministic artifact names and SHA-256 values;
- retain verification logs;
- require approval before stable publication.

The included `.github/workflows/angelcare-desktop-release.yml` is the CI-ready reference configuration.

## 15. Final release gate

A release is approved only when:

- cumulative verification passes;
- security smoke tests pass;
- package signature/notarization status is accurately declared;
- update manifest and checksums pass;
- validation workbook has no unresolved release-blocking failure;
- rollback materials are available;
- user, administrator, troubleshooting, migration and linked-device manuals are current;
- no WhatsApp content or authentication material is included in artifacts or logs.
