# Mega ZIP 1 Handover — Desktop Runtime Foundation

## Runtime topology

```text
ANGELCARE Desktop BaseWindow
├── Local shell WebContentsView
│   ├── product toolbar
│   ├── loading/offline/error state
│   └── controlled runtime actions
└── ANGELCARE SaaS WebContentsView
    ├── persistent session: persist:angelcare-saas
    ├── production or localhost URL
    ├── restricted navigation
    └── read-only desktop detection preload
```

## Files of authority

| Responsibility | File |
|---|---|
| Desktop lifecycle | `src/main.cjs` |
| SaaS-safe preload | `src/preload.cjs` |
| Local shell IPC | `src/shell-preload.cjs` |
| Runtime configuration | `src/runtime/config.cjs` |
| Navigation policy | `src/runtime/url-policy.cjs` |
| Runtime logs | `src/runtime/logger.cjs` |
| Local desktop shell | `src/shell/*` |
| Packaging | `forge.config.cjs` |
| Default contract | `config/defaults.json` |
| Next.js detection | `apps/ops-web/components/desktop/DesktopRuntimeBridge.tsx` |
| Desktop health route | `apps/ops-web/app/api/desktop/runtime/health/route.ts` |

## Runtime storage

The desktop stores only runtime configuration, Chromium session data, logs and local crash evidence under Electron's platform-specific `userData` directory. Secrets must not be written to `desktop-config.json`.

## Supported URL rules

- HTTPS is mandatory for production.
- HTTP is accepted only for `localhost`, `127.0.0.1` or `::1` in development.
- Main-frame navigation is restricted to configured ANGELCARE hosts.
- External links are opened through the operating-system browser only when their protocol is allowlisted.

## Logging

Runtime log:

```text
<userData>/logs/angelcare-desktop.log
```

Logs rotate at 5 MB and retain three archives. They must not contain credentials, cookies, tokens or message content.

## Environment contract

| Variable | Purpose |
|---|---|
| `ANGELCARE_DESKTOP_APP_URL` | SaaS target URL |
| `ANGELCARE_DESKTOP_ALLOWED_HOSTS` | Additional trusted navigation hosts |
| `ANGELCARE_DESKTOP_RELEASE_CHANNEL` | Release channel metadata |
| `ANGELCARE_DESKTOP_BUILD_ID` | Build/release identifier |
| `APPLE_*` | Optional macOS signing/notarization |
| `WINDOWS_CERTIFICATE_*` | Optional Windows signing |

## Acceptance checklist

- Only one desktop instance opens.
- Local shell appears before the SaaS.
- Local development loads `http://localhost:3000`.
- Production preview loads the configured HTTPS SaaS.
- Login state persists after closing and reopening.
- External links cannot replace the main SaaS view.
- Node.js objects are unavailable to the SaaS page.
- Offline and failed-load states expose Retry and Browser actions.
- Renderer crashes produce a recoverable state.
- `/api/desktop/runtime/health` returns `ok: true`.
- The SaaS document receives `data-angelcare-desktop="true"`.
- `npm run verify` passes.
- Platform package commands create artifacts under `out/` on their native operating system.
