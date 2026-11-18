# AngelCare Android R5.2 — Approved launcher artwork + mobile viewport truth

## Delivered
- Exactly the user-selected **1254 x 1254 PNG**, SHA256 `7281e1a449966c58d5bb57355f293ae09e60e3856169e6fc848ee61f5df1de70`, retained verbatim under `assets/` for traceability.
- Android legacy density icons: mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192.
- Android 8+ adaptive icon with 432x432 foreground, white background, artwork safely inset for OEM masks.
- Version code 7 / version 0.5.2, stable prior signing identity unchanged.
- Existing R5.1 splash, direct verified TWA, LiveKit IVR, conditional FCM UX untouched.
- Dedicated Android CI builds and certifies R5.2 signed debug preview artifact. Production AAB remains UNSIGNED.

## Why this patch cannot convert the full Marketplace to mobile layout
Trusted Web Activity is rendered by Chrome using its own website document. Native Android code cannot override web viewport/CSS or Chrome's requested desktop-site preference. Before changing any Marketplace code, on the Android device open Chrome > Settings > Site settings > Desktop site > Mobile site and remove any `my.angelcarehub.com` desktop exception. Reload the app. If the website still looks like desktop at a real 360-430 CSS-pixel viewport, that is a **web responsive-design issue** requiring a separate scoped `apps/marketplace-web` patch, GitHub GHCR build, and operator-approved Coolify deploy. No fake Android User-Agent hack or WebView substitution has been made here.

## Protection contract
- Changes: `mobile/angelcare-customer-android/**`, `.github/workflows/build-angelcare-customer-android.yml` only.
- No Next.js/web CSS, global navigation, database, hotline/IVR, Coolify, GHCR, or production site changes.
- Installer never checks out a branch and never runs local Gradle. It works from an isolated Git index and safeguards the exact GitHub Draft PR #2 head.
- Signing remains the same preview keystore (stored outside the repo) and same `com.angelcare.marketplace.preview` package and domain trust. User installs APK over R5.1 after successful GitHub Actions.
