# ANGELCARE Desktop Mega ZIP 6 — Corporate Station OS 1.5.0

## Purpose

Mega ZIP 6 upgrades the cumulative ANGELCARE Desktop runtime into a centrally governed corporate workstation shell while preserving the ANGELCARE SaaS surface, the real human-operated WhatsApp Web session, the existing device/workspace lease controls, and all Mega ZIP 1–5 hardening.

## Delivered runtime

- Protected ANGELCARE and WhatsApp system tabs.
- Isolated `persist:angelcare-corporate-browser` session for governed web tabs.
- Create, close, duplicate, pin, reorder, reopen and restore corporate tabs.
- URL normalization, dangerous-scheme denial, domain policy and popup conversion.
- Per-tab zoom from 60% to 200%.
- Standard, Corporate Focus and Corporate Locked station modes.
- Trusted local unlock window using salted scrypt verifiers, throttling, lockout and device-bound offline recovery.
- Durable offline station-event queue reconciled after connectivity returns.
- Safe remote command processing with expiry, acknowledgement and replay protection.
- Crash, renderer and session recovery without WhatsApp cookie or content centralization.

## Central control plane

The existing `/whatsapp-os/admin` workspace now includes **Postes & Mode Corporate**, backed by dedicated station policies, browser policies, assignments, unlock credentials, one-time recovery codes, attempts, events, tab templates, safe tab metadata, commands, policy versions and security events.

## Security boundary

WhatsApp remains manually operated. Mega ZIP 6 adds no DOM scraping, automatic Send action, message extraction, cookie export, mass messaging, unrestricted Node.js, unrestricted IPC, arbitrary shell execution or plaintext unlock credentials. Electron kiosk is application-level enforcement; supported Windows policy or macOS MDM is required for genuine operating-system lockdown.

## Verification

Run from `apps/angelcare-desktop`:

```bash
npm run verify
```

Then, from `apps/ops-web` with repository dependencies installed:

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false
```

Do not run production builds, installer packaging, SQL execution, Supabase push, Git staging, commit or push as part of Mega ZIP application.
