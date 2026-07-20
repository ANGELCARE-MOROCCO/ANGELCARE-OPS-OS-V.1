# ANGELCARE Desktop — Mega ZIP 3 Handover

## Product contract

Mega ZIP 3 adds the centralized governance layer above the secure embedded WhatsApp runtime delivered by Mega ZIP 2. It governs who may open a workspace, from which approved device, for how long, under which policy, and how access is revoked.

## Mandatory production configuration

Set a strong server-only value in every deployed Next.js environment:

```env
WHATSAPP_DESKTOP_LEASE_SECRET=<minimum-64-random-characters>
```

Never expose this value to Electron, browser JavaScript, screenshots or Git. The application may derive a development fallback from the Supabase service-role key, but an explicit secret is mandatory for production governance.

## Database deployment

Apply:

```text
apps/ops-web/supabase/migrations/20260720_whatsapp_desktop_governance_mega_zip3.sql
```

Using the linked Supabase CLI:

```bash
cd apps/ops-web
npx supabase db push
```

Manual SQL alternative:

```text
apps/ops-web/database/whatsapp-desktop-governance-mega-zip3-20260720.sql
```

## Administration route

```text
/whatsapp-os/admin
```

The central cockpit contains workspaces, assignments, devices, access requests, policies, remote commands, security events and audit.

## Device lifecycle

1. The authenticated desktop registers a persistent installation ID.
2. The device appears as `pending`.
3. An administrator approves it for one or more workspaces.
4. The user must also hold an active assignment.
5. Electron requests a short-lived authorization lease directly through its authenticated SaaS session.
6. The WhatsApp surface remains hidden until the lease is valid.
7. Heartbeats and lease renewal keep access active.
8. Revocation invalidates leases and issues an allowlisted remote command.

## No centralized WhatsApp session data

The following remain local to each workstation and are never uploaded through Mega ZIP 3:

- WhatsApp cookies
- IndexedDB
- service workers
- linked-device authentication material
- contacts or chat content
- QR session secrets

## Remote command allowlist

```text
HIDE_WHATSAPP_VIEW
SHOW_ACCESS_REVOKED_NOTICE
RELOAD_WHATSAPP_VIEW
RESTART_WHATSAPP_RENDERER
CLEAR_WHATSAPP_CACHE
CLEAR_WHATSAPP_SESSION
REFRESH_AUTHORIZATION
LOG_OUT_ANGELCARE_DESKTOP
```

The server cannot send JavaScript, shell commands or filesystem paths.

## Acceptance sequence

1. Apply migration and configure `WHATSAPP_DESKTOP_LEASE_SECRET`.
2. Run the SaaS and ANGELCARE Desktop in development mode.
3. Sign in to ANGELCARE Desktop.
4. Open `/whatsapp-os/web-session` and confirm device registration.
5. Open `/whatsapp-os/admin` as a super administrator.
6. Create an active workspace.
7. Assign the test user.
8. Approve the registered device for the workspace.
9. Return to the workspace, select it and confirm a valid lease.
10. Confirm WhatsApp appears only after authorization.
11. Revoke the assignment and verify the native view closes.
12. Issue a cache-clear or renderer-restart command and verify acknowledgment.
13. Test offline grace and lease expiry.
14. Confirm audit/security records contain governance metadata only.

## Installer policy

Do not rebuild the DMG or Windows installer after Mega ZIP 3. Continue through Mega ZIPs 4 and 5, then create the final signed-installation candidates from the completed cumulative source.
