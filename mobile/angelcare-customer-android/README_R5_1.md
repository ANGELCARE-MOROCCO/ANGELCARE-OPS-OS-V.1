# AngelCare Android R5.1 — Official TWA startup splash, no browser workaround

## Observed customer device issue
R5 already reaches verified fullscreen and its existing Marketplace IVR/LiveKit agent call works. On cold launch the Android phone briefly shows a Chrome/browser toolbar for ~3–5 seconds before it disappears.

## Narrow solution
The previous manifest had no splash image / FileProvider. This change configures the official Google Android Browser Helper **transferable Trusted Web Activity splash screen** as documented by Android Browser Helper (`PwaWrapperSplashScreenStrategy`), reusing the already-approved AngelCare official wordmark on an entirely white background. The transparent trampoline activity stays intact.

`angelcare_official_wordmark.png` is the existing real asset; no new logo is invented. The screen is a transient splash while the page starts, **NOT an extra homepage, loading browser, or redesigned website**.

The FileProvider grants only transient URI permissions to the browser for `files/twa_splash/`, with per-applicationId authority `${applicationId}.twa_splash_fileprovider`. No broad storage permissions.

## Contracts
- No modifications to `apps/marketplace-web`, LiveKit, IVR, SQL, Customer OS, Coolify, main release workflow or web `assetlinks.json`.
- Same applicationId (`com.angelcare.marketplace.preview`) and same protected signing key / Digital Asset Links fingerprint.
- Version code increases from 5 to 6, preview version name 0.5.1.
- No Android RECORD_AUDIO permission, no native voice search. Website controls mic prompt after real eligible agent pickup.
- Existing FCM-onboarding/notification-consent card stays conditional and unchanged.
- No extra splash delay or blocking timer: Chrome/browser transfers and releases the splash according to its own page-loaded event.
- Browser providers not supporting Chrome TWA splash may fall back gracefully to prior startup. It is not possible to guarantee a permanently absent browser toolbar on every device/provider by Android shell code alone.
- Device test must check cold/warm launch, loading-to-fullscreen timing, and a real Hotline call. Confirm if a Chrome bar still leaks through before accepting R5.1.

## Build
GitHub Actions only; no local Gradle build. PR #2 stays Draft. CI statically certifies the source, compiles APK, inspects compiled manifest (splash metadata + FileProvider), verifies APK signer and uploads the R5.1 artifact. All the original Android/Marketplace safety gates remain.
