# Social Command MZ3 · Final Handover

## Apply gate
The installer verifies every overwritten file against the SHA-256 of the exact live source captured on 2026-08-09 14:21. If any file drifted after capture, installation stops before modification.

## Verification executed by installer
1. MZ3 static contract verifier.
2. Node syntax check for Windows gateway.
3. Targeted Social Command TypeScript check with 8 GiB heap if local `node_modules/.bin/tsc` exists.
4. No production build.
5. No SQL.

Any verifier/targeted-TypeScript failure automatically restores the pre-MZ3 backup.

## Production activation after deploy
1. Preserve existing Meta OAuth 10-permission working envelope.
2. Configure the dedicated webhook signing secret only if webhook diagnostics show the existing Meta secret is not the signing key.
3. Use Control → Webhooks → Self-test signature.
4. Use Inspect subscriptions, then Reconcile subscriptions.
5. Observe real live events; do not weaken signature verification to make Meta sample tests pass.
6. Enable automatic subscription reconciliation only after successful production inspection.
7. Enable RBAC enforcement only after comparing real application roles with the MZ3 role map.

## Windows activation
Run the package-level `WINDOWS_UPGRADE_SOCIAL_COMMAND_MZ3.ps1` from an elevated PowerShell session on the AngelCare Windows host. It backs up the installed gateway, updates it, hardens the scheduled runner, restarts the service when present and checks `/health`.
