# AngelCare Android R5.3 — exact approved logo, one Android launcher mask

This surgical update removes the glossy white rounded-square panel and its drop shadow **from inside** the R5.2 launcher artwork. The original approved multicolor ANGEL CARE logo was isolated pixel-for-pixel from the approved R5.2 PNG; no new logo was designed.

For Android 8+ the 432×432 foreground is transparent outside the logo and the unchanged adaptive icon XML supplies only a flat white background. Android applies its own single OEM mask (circle/squircle). Android 7 legacy density assets use the same logo on plain white; no decorative rounded frame.

Source of truth `assets/APPROVED_ANGELCARE_R5_2_ICON_SOURCE.png` stays unchanged, as do all application Java code, official splash, TWA/domain association, LiveKit/IVR, FCM, browser viewport, and persistent debug keystore. `versionCode=8`, `versionName=0.5.3` for installation over the existing R5.2 preview. Android CI only; no Marketplace/Docker/Coolify deployment, no desktop/local build, no SQL.

The new transparent extracted logo is `assets/ANGELCARE_R5_3_LOGO_ONLY_TRANSPARENT.png`.
