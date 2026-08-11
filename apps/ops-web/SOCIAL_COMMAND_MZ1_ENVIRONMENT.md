# Social Command MZ1 · Environment Contract

Configure these only in trusted server/runtime environments. Never expose secrets as `NEXT_PUBLIC_*`.

```env
META_APP_ID=<ANGELCARE SOCIAL COMMAND App ID>
META_APP_SECRET=<server-only Meta App Secret>
META_LOGIN_CONFIGURATION_ID=<AngelCare Social Connect configuration ID>
META_GRAPH_VERSION=v26.0
SOCIAL_COMMAND_PUBLIC_BASE_URL=https://opsmanagement.angelcarehub.com

SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY=<32-byte key, 64 hex chars recommended>
SOCIAL_COMMAND_MEDIA_SIGNING_SECRET=<strong shared signing secret>
SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN=<strong admin token>
SOCIAL_COMMAND_MEDIA_GATEWAY_PUBLIC_URL=https://<your-public-media-gateway-host>
SOCIAL_COMMAND_WORKER_SECRET=<strong worker secret>
```

Windows gateway:
```env
SOCIAL_COMMAND_MEDIA_ROOT=D:\AngelCareData\SocialCommand
SOCIAL_COMMAND_MEDIA_GATEWAY_PORT=8789
SOCIAL_COMMAND_MEDIA_SIGNING_SECRET=<same signing secret>
SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN=<same admin token>
SOCIAL_COMMAND_MEDIA_ALLOWED_ORIGIN=https://opsmanagement.angelcarehub.com
SOCIAL_COMMAND_MEDIA_MAX_BYTES=1073741824
```

Windows scheduler:
```env
SOCIAL_COMMAND_WORKER_TICK_URL=https://opsmanagement.angelcarehub.com/api/social-command/worker/tick
SOCIAL_COMMAND_WORKER_SECRET=<same worker secret>
```

## Meta permission note
The Facebook Login configuration used by production must grant the permissions required for the capabilities you activate. Facebook Page publishing requires the Page publishing permission; Instagram content and messaging require the relevant Instagram scopes. Social Command displays the scopes actually granted and does not manufacture capabilities.
