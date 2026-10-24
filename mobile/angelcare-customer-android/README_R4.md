# AngelCare Android R4 — Native Companion, Voice and Push

Authority: `mobile/angelcare-customer-android` plus the dedicated Android CI workflow ONLY.
Marketplace website, database, CMS and Coolify are unchanged. Verified TWA domain / R3 signer preserved.

## User-visible changes

- Native AngelCare launch/command hub using the existing **official AngelCare public brand asset** (taken from historical Marketplace repository archive, not invented artwork).
- One-tap verified fullscreen Marketplace entry. Storefront layout remains exactly as live on Coolify.
- Native Voice Navigator with FR/AR/EN speech-to-text using an available Android recognition provider; transcription opens the actual canonical Marketplace `marketplace/search?q=` route. Speech is not recorded or stored by AngelCare native code. Recognition providers may process audio under their own policies.
- Native general-notification inbox, retained on device only; explicit local test message marked TEST LOCAL, not a fake user event.
- Opt-in FCM **public-topic** announcements, activities, offers; Android 13+ notification permissions; unsubscribe; short public data-only messages; deep links restricted to the verified AngelCare domain.
- Home-screen voice/inbox launcher shortcuts and offline retry.
- Android signing fingerprint pinned and verified in remote GitHub CI.

## Push sender

`node mobile/angelcare-customer-android/push-sender/send.mjs --title "Nouvelle activité" --body "Découvrez les activités publiées" --kind activity --url "https://my.angelcarehub.com/angelcare-marketplace/fr"`

By default this is a **dry run**. No network and no credentials are required.
For a real PUBLIC TOPIC broadcast from a secured operator machine, set `ANGELCARE_FCM_PROJECT_ID` and `ANGELCARE_FCM_SERVICE_ACCOUNT_FILE` pointing OUTSIDE the repository to your authenticated Google Firebase service account file, then append `--send --confirm-public-broadcast`. Never place this service key in the APK, repo, or browser. Sender script validates message length/type and strict URL host/path; do not put child names, booking details or personal data in public-topic messages.

## Required Firebase onboarding (not inventable)

Create/select an official Firebase project, add an Android app with package name `com.angelcare.marketplace.preview`, and obtain exactly four **client** config fields:

- `ANGELCARE_FCM_PROJECT_ID` — Firebase project ID
- `ANGELCARE_FCM_APP_ID` — Firebase Android App ID (`1:...:android:...`)
- `ANGELCARE_FCM_API_KEY` — Firebase web/API client key (NOT a service-account secret)
- `ANGELCARE_FCM_SENDER_ID` — Google Cloud Messaging sender/project number

Store client fields as secrets in GitHub Actions repository; **Android CI can build without them**, in which case FCM is explicitly `NOT_CONFIGURED` and offers no fake opt-in. After adding fields, rebuild R4 with the dedicated Android workflow. These client fields are packaged into APK by design, so they do not constitute server privileges.

Server/operator sender requires a separately secured official service-account key with Firebase Messaging permission; DO NOT upload it here or to the Android CI. Google Play services are needed for FCM. The Firebase project must have Firebase Cloud Messaging API enabled. The web Marketplace does not automatically dispatch booking notifications. Account-linked pushes require a separate authenticated backend integration and explicit review/consent.

## Not included / no false claims

- No automatic booking/order status pushes: such events live in Marketplace and cannot be inferred by an isolated Android APK.
- No mic permanently drawn over website: fullscreen TWA has its own web-rendering surface. Native Voice Navigator is accessed through the native hub/shortcut.
- No private individual push or customer token linkage.
- No live FCM broadcast until a real Firebase project, installed APK and public-topic subscriber exist.
- No Google Play release signing/distribution; this is a signed Android preview and an unsigned AAB.

## Acceptance

1. GitHub Actions all steps PASS, including native component APK manifest and **matching pinned SHA256 certificate**.
2. Update existing R3 preview to R4 (same `com.angelcare.marketplace.preview` and same private key).
3. Launcher displays official AngelCare native hub; tap Marketplace, inspect fullscreen trust and unchanged shopping/checkout.
4. Microphone invokes explicit Android speech provider; review text before search.
5. Local notification test populates inbox (banner only after Android permission granted).
6. Without Firebase config, opt-in explicitly says unavailable; with official config and consent, FCM public-topic delivery/inbox tested on a real device.
7. Confirm uninstall/permission-denial/offline/return-from-payment routes remain safe.
