# AngelCare Social Command · Windows Media Gateway

This service is deliberately separate from Supabase Storage and separate from the Email OS attachment namespace. It is intended to run on the same trusted AngelCare Windows infrastructure while keeping its own storage root.

## Default media root
`D:\AngelCareData\SocialCommand`

## Required variables
- `SOCIAL_COMMAND_MEDIA_ROOT`
- `SOCIAL_COMMAND_MEDIA_GATEWAY_PORT` (default 8789)
- `SOCIAL_COMMAND_MEDIA_SIGNING_SECRET` — must be identical to the Ops Web server secret
- `SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN` — must be identical to the Ops Web server secret
- `SOCIAL_COMMAND_MEDIA_ALLOWED_ORIGIN` — production AngelCare web origin
- optional `SOCIAL_COMMAND_MEDIA_MAX_BYTES` (default 1 GiB)

## Network requirements
The public delivery endpoint must be HTTPS-reachable by Meta for scheduled media fetches. Use the existing AngelCare reverse-proxy/tunnel pattern. Do not expose the admin token endpoint publicly without network controls.

## Storage boundary
Supabase stores metadata only. The actual JPG/PNG/WEBP/MP4/MOV files remain on Windows.

## Streaming
Uploads are direct browser `PUT` streams to the gateway. The Next.js process does not buffer media binaries.
