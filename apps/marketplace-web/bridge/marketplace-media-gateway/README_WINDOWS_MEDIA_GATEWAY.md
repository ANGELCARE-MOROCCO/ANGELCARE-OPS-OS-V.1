# AngelCare Marketplace Windows Media Gateway

Marketplace-owned adaptation of the proven Social Command Media Vault doctrine. It runs separately on trusted AngelCare Windows infrastructure and uses the frozen Marketplace root (`S:\AngelCareData\Marketplace` by default). No runtime import or storage namespace is shared with Ops OS.

Required server variables:

- `MARKETPLACE_MEDIA_ROOT`
- `MARKETPLACE_MEDIA_GATEWAY_PORT` (default `8790`)
- `MARKETPLACE_MEDIA_SIGNING_SECRET`
- `MARKETPLACE_MEDIA_GATEWAY_ADMIN_TOKEN`
- `MARKETPLACE_MEDIA_ALLOWED_ORIGIN`

Application runtime variables:

- `MARKETPLACE_MEDIA_GATEWAY_PUBLIC_URL`
- `MARKETPLACE_MEDIA_SIGNING_SECRET` (same signing secret)
- `MARKETPLACE_MEDIA_GATEWAY_ADMIN_TOKEN` (same admin token)

Optional policy variables:

- `MARKETPLACE_MEDIA_MAX_BYTES` (default 40 MiB)
- `MARKETPLACE_MEDIA_MIN_FREE_BYTES` (default 10 GiB reserve)
- `MARKETPLACE_MEDIA_TEMP_RETENTION_HOURS` (default 24)
- `MARKETPLACE_MEDIA_ALLOWED_MIME`

The application creates a short-lived HMAC upload URL. The browser streams the binary directly to this gateway; the gateway validates token, MIME declaration, magic bytes, extension, size and disk reserve, then writes immutable metadata with SHA-256. The application verifies that metadata before activating its canonical media record. Delivery is HMAC-signed and supports range requests. Permanent deletion requires the gateway admin token and is blocked by the Marketplace application while usage references exist.

Never place this root under the Social Command root. Use a dedicated Windows service identity with read/write access only to the Marketplace root.
