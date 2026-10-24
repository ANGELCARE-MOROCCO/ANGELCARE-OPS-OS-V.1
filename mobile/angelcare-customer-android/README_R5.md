# AngelCare Android R5 — Corrected after inspecting the real Marketplace Hotline OS

- Existing public Hotline IVR, manual reception, LiveKit sessions and operator pickup are in `apps/marketplace-web/angelcare-marketplace/hotline-os`. **No modifications to these sources.**
- R5 removes R4's invented native homepage and speech-to-text search UI; the launcher immediately opens the existing verified fullscreen TWA.
- Microphone permission remains a **web site permission** mediated by the Android browser for LiveKit's call; `HotlinePublic.tsx` only calls `useHotlineMedia.connect` after session state enters `connecting` or `connected`, itself authorized by explicit agent pickup.
- No Android `RECORD_AUDIO` permission, no recognizer intent, no phone number, no WhatsApp, no duplicate IVR/calling service.
- Optional FCM public-topic notifications preserve the Android receiver; when real client config is present and user has never made a decision, a **single white AngelCare branded native consent card** appears before first TWA launch. Android 13+ then displays the OS notification permission on explicit acceptance only. With no real Firebase config there is no fake dialog and the TWA opens directly.
- Existing R4 app data includes opt-in preference and local notification history; no new local inbox screen. Notification taps are routed to the actual verified Marketplace URL.
- Launcher icon is the existing official AngelCare wordmark centered on a white background (no invented branding).
- Same signing key, package `com.angelcare.marketplace.preview`, SDK, domain association and external release procedure.
- R5 deliberately does not claim that LiveKit works in every Android/browser hardware environment; verify actual customer & agent call, permission only after pickup, audio, hangup and blocked-permission recovery on real devices.
- Firebase project setup still required to activate actual remote announcements; this patch does not enable real pushes or use any service-account key.
