# Provider configuration and live acceptance

## Existing environment

Use the existing Marketplace environment. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Set `NEXT_PUBLIC_SITE_URL=https://my.angelcarehub.com` (or the existing canonical `NEXT_PUBLIC_APP_URL`). Never expose the service-role key in client variables.

No SMTP or Supabase configuration is changed by this ZIP. Existing email/password auth and a functioning mail provider are required. Phone OTP is excluded.

## Supabase redirect allowlist

Allow the production callback URL, including its query parameters, under:
`https://my.angelcarehub.com/angelcare-marketplace/auth/callback**`

Retain existing confirmation/reset/verified URL allowances while older issued links are still in use. For development, add equivalent localhost paths only to your development configuration.

## Cross-device email templates

The application supports the default PKCE flow (normally opened in the browser that requested the link). For links that also work in another browser/device, use the generated `.RedirectTo` destination plus the provider `.TokenHash`. The app's new email redirects already contain a query string, locale, flow and safe return destination.

Confirmation email action:
```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Confirmer mon email</a>
```

Recovery email action:
```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery">Choisir un nouveau mot de passe</a>
```

Magic-link email action:
```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Ouvrir Mon ANGELCARE</a>
```

Paste the relevant action into the existing branded Supabase email template, retaining its other content. Request new emails after changing a template. Already-issued links keep their original destinations and expiry. An old hardcoded confirmation template can still use `/angelcare-marketplace/auth/confirm?token_hash=...&type=email`; signup's stored safe destination provides compatibility. Old magic/recovery templates that discard `.RedirectTo` cannot reliably retain a new journey destination; update them.

## Checklist after deployment

- [ ] Verify the deployed image contains this source revision, and hard-refresh all five FR pages.
- [ ] Open registration from a Families request with a selected `need`; switch modes and languages; verify the need remains in `returnTo`.
- [ ] Register one authorized test customer; receive the real email; confirm it; verify canonical customer status and linked family dossier.
- [ ] Open the token-hash email link in another browser/device; verify account access and continuation.
- [ ] Retry an expired/already-used link; verify no false success; request a new confirmation.
- [ ] Confirm a duplicate signup cannot change the existing profile, status, phone, kind or consent metadata.
- [ ] Log in using email/password; check real customer cookies, account pages and original return destination.
- [ ] Request recovery; receive the email; set a valid matching password; sign in with the new password.
- [ ] Request a magic link for the existing customer; verify its real delivery and destination.
- [ ] Open a real owned journey; use its canonical customer actions/notifications. Verify another customer's journey is inaccessible.
- [ ] Verify customer HTML sends `Cache-Control: private, no-store` and cookie refresh survives an expired access token.
- [ ] Verify guest commerce is attached by the existing RPC after authenticated login/confirmation, including the current browser's visitor reference.
- [ ] Verify account password changes, session revocation and existing logout endpoint with live cookies.
- [ ] Check FR, EN, AR, phone/tablet/desktop, keyboard and reduced-motion settings.
- [ ] Confirm phone OTP has no active sign-in control.

Build/release authority remains Marketplace source → `Build Marketplace GHCR One-Off` with its exact source pin → immutable GHCR digest → Coolify deployment without cache. Desktop workflows do not certify Marketplace.
