# AngelCare Customer Android R1 — isolated TWA prototype

## Authority

- Web and commerce backend remain `apps/marketplace-web` on existing infrastructure.
- Android code is additive, under `mobile/angelcare-customer-android` only.
- Preview package: `com.angelcare.marketplace.preview` (`debug` auto-signing, per runner).
- **Proposed** eventual release package: `com.angelcare.marketplace` (not approved/reserved).
- Launch URL: `https://my.angelcarehub.com/angelcare-marketplace/fr`.
- The app uses the Google Android Browser Helper `LauncherActivity` for a Trusted Web Activity; until Digital Asset Links is live it can display a browser toolbar / fallback.

## What this R1 produces

The GitHub workflow `.github/workflows/build-angelcare-customer-android.yml` builds an **installable debug-signed preview APK** and an **unsigned release AAB** on `ubuntu-latest`. It does **not** build Next.js, deploy the web app or trigger GHCR. A debug keystore generated on a transient GitHub runner is NOT a sustainable signing identity; don't distribute debug builds as production.

This is **not** a native rewrite of commerce. Web server availability and cross-domain authentication/payment journeys remain external requirements for meaningful use.

## Build and delivery

- This source ZIP is designed to be added as *new* repository files only.
- Opening a PR targeting `upgrade/next-angelcare-upgrade` can run the narrow `pull_request` workflow from this PR branch. The workflow can also be dispatched manually once GitHub recognizes it on the repository's default branch.
- Download the APK from the named GitHub Actions **artifact** after workflow success.
- No local builds are part of the installation script. CI compiles the Android project only.

## Mandatory release gates AFTER preview

1. Approve actual official AngelCare square launcher icons and splash assets. R1 intentionally has no invented logo and Android uses the platform fallback icon.
2. Approve Android applicationId; configure durable keystore/Play App Signing and reproducible versioning.
3. Publish and verify `/.well-known/assetlinks.json` through existing website release authorities; use **the correct certificate fingerprint** (debug and Play App Signing differ).
4. Validate approved web manifest properties and production HTTPS reachability independently.
5. Device test Chrome and supported Android browsers, no-browser fallback, all FR/EN/AR paths, customer login/OAuth, PayPal external approval and return, cookies, file downloads, accessibility, customer logout.
6. Validate Google Play payments and Families policy implications before distribution.
7. Only after all gates: dedicated signed release workflow with guarded secrets and manual approval.

## Safety

- No `apps/marketplace-web` modification.
- No `.github/workflows/build-marketplace-ghcr-oneoff.yml` modification.
- No Docker/Coolify/server change.
- No background networking, SDK install, build, `git add`, `git commit` or `git push` in the included local installer.
