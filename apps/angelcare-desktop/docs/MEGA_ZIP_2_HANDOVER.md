# Mega ZIP 2 Handover — WhatsApp Web Runtime

## Runtime architecture

```text
ANGELCARE BaseWindow
├── Local shell WebContentsView
├── ANGELCARE SaaS WebContentsView
└── WhatsApp Web WebContentsView
    └── persist:angelcare-whatsapp-main
```

The SaaS page reserves a DOM rectangle and sends only x/y/width/height values to the Electron main process. Electron translates the reserved area into native `WebContentsView` bounds. The SaaS renderer never receives WhatsApp DOM access.

## Local profile

Cookies, IndexedDB, cache storage, service workers and other browser data are stored in Electron's persistent partition on the workstation. They are not uploaded to the application database.

## Commands

The preload exposes only allowlisted commands: show, hide, reload, hard reload, back, forward, focus, external open, phone/message navigation, restart, cache clearing, session clearing, downloads folder and layout changes.

## Downloads

Downloads are stored under the operating-system Downloads directory in `ANGELCARE WhatsApp`. Executable and script-like extensions are blocked before writing.

## Permissions

Only official WhatsApp resource origins can request notifications, media, clipboard read and fullscreen. USB, HID, serial and display capture are denied.

## Recovery

- Load failure: reload or hard reload.
- Unresponsive renderer: restart WhatsApp engine.
- Crashed renderer: restart WhatsApp engine; the persistent profile remains.
- Corrupted cache: clear cache without clearing login.
- Compromised/revoked workstation: erase complete linked session and remove the workstation from WhatsApp Linked Devices.

## Mega ZIP 3 boundary

Central workspace creation, user assignments, device enrollment, remote revocation and desktop heartbeat are intentionally deferred to Mega ZIP 3.
