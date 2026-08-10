# AngelCare Social Command · Windows Media Gateway

This service is deliberately separate from Supabase Storage and from the Email OS attachment namespace. It runs on trusted AngelCare Windows infrastructure with an isolated storage root and signed upload/delivery URLs.

## Default locations
- Install directory: `C:\AngelCare\SocialCommandMediaGateway`
- Media root: `D:\AngelCareData\SocialCommand` unless `SOCIAL_COMMAND_MEDIA_ROOT` overrides it.

## Required machine environment variables
- `SOCIAL_COMMAND_MEDIA_ROOT`
- `SOCIAL_COMMAND_MEDIA_GATEWAY_PORT` (default `8789`)
- `SOCIAL_COMMAND_MEDIA_SIGNING_SECRET` — identical to the Ops Web server secret
- `SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN` — identical to the Ops Web server secret
- `SOCIAL_COMMAND_MEDIA_ALLOWED_ORIGIN` — production AngelCare web origin

## Optional hardening variables added by MZ3
- `SOCIAL_COMMAND_MEDIA_MAX_BYTES` — default 1 GiB
- `SOCIAL_COMMAND_MEDIA_MIN_FREE_BYTES` — default 10 GiB reserve; uploads are rejected with HTTP 507 before the reserve is violated
- `SOCIAL_COMMAND_MEDIA_TEMP_RETENTION_HOURS` — default 24 hours; stale partial uploads are purged on startup and every 30 minutes
- `SOCIAL_COMMAND_MEDIA_ALLOWED_MIME`

## Health and maintenance
- `GET /health` reports free/total/used bytes, free-space ratio, reserve, temporary-file count and warnings.
- `POST /admin/maintenance` with `x-social-media-admin-token` runs temporary-file cleanup and returns current disk state.

## Scheduler security
`INSTALL_WINDOWS_SCHEDULER.ps1` no longer embeds the worker secret in `tick.ps1`. The generated task runner resolves `SOCIAL_COMMAND_WORKER_TICK_URL` and `SOCIAL_COMMAND_WORKER_SECRET` from Windows Machine environment variables at runtime.

## Network requirements
The public delivery endpoint must be HTTPS-reachable by Meta for scheduled media fetches. Keep using the established AngelCare reverse-proxy/tunnel pattern. Admin endpoints must remain protected by the admin token and trusted network controls.

## Storage boundary
Supabase stores metadata only. Actual JPG/PNG/WEBP/MP4/MOV binaries remain on Windows.

## Streaming
Uploads are direct browser `PUT` streams to the gateway. The Next.js process does not buffer media binaries.
