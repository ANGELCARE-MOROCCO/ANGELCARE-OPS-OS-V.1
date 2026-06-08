# AngelCare Shopify API

Dependency-free Node.js backend for the AngelCare Shopify dashboard integration.

## Run

```bash
npm run start
```

Default URLs:

- Dashboard: `http://localhost:8100/dashboard`
- Install OAuth: `http://localhost:8100/install`
- Health: `http://localhost:8100/health`
- Summary API: `http://localhost:8100/api/dashboard/summary`
- Traffic summary: `http://localhost:8100/api/traffic/summary`

## Shopify CLI Install Flow (June 2026)

Shopify still doesn't support silently installing an app onto a store from the Admin API or CLI. The supported path is to automate app configuration and setup, then use Shopify's install authorization once.

As of June 3, 2026, the latest stable Shopify API version is `2026-04`. The next stable version, `2026-07`, is scheduled for July 1, 2026, so this app intentionally defaults to `2026-04`.

1. Create `.env` from the template and fill in the real app/store values:

```bash
cp .env.example .env
```

Required values:

- `APP_URL`: the public HTTPS URL for this backend
- `SHOPIFY_CLIENT_ID`: the app client ID from the Shopify Dev Dashboard
- `SHOPIFY_CLIENT_SECRET`: the app secret from the Shopify Dev Dashboard
- `SHOPIFY_SHOP_DOMAIN`: the target `.myshopify.com` store

2. Generate the Shopify CLI app config from `.env`:

```bash
npm run shopify:config
```

This writes `shopify.app.toml` with:

- standalone app mode (`embedded = false`)
- Shopify-managed scopes (`use_legacy_install_flow = false`)
- OAuth callback URL (`/api/auth/callback`)
- app/uninstalled and privacy compliance webhooks (`/api/webhooks/shopify`)
- app preferences URL (`/dashboard`)

3. Link or create the app in Shopify CLI if needed, then deploy the configuration:

```bash
shopify app config link
shopify app deploy
```

4. Start this backend and generate the supported install URL:

```bash
npm run start
npm run shopify:install-url
```

Open the printed URL while logged into a Shopify account with permission to install apps on the target store. Shopify will approve the scopes and redirect to `/api/auth/callback`, where this backend stores the offline Admin API token in `.env`.

5. Verify the installation and granted scopes:

```bash
npm run shopify:status
```

For organization-owned stores where the app is already installed, `SHOPIFY_TOKEN_GRANT=client_credentials` can request short-lived tokens without end-user interaction. It does not install the app.

## Free Cloudflare Hosting

Cloudflare Workers is the best free-friendly target for this repo because it gives you a public HTTPS URL without running a server. This app includes a Worker entrypoint at `src/cloudflare-worker.ts` and a `wrangler.toml`.

The Worker uses:

- Worker environment variables/secrets instead of `.env`
- Cloudflare KV for the OAuth Admin API token
- Cloudflare KV for recent traffic and webhook event logs
- the existing `/install`, `/api/auth/callback`, `/dashboard`, and API routes

1. Log into Cloudflare from this repo:

```bash
npx wrangler login
```

2. Create the KV namespace:

```bash
npx wrangler kv namespace create ANGELCARE_KV
```

Copy the returned namespace id into `wrangler.toml` by uncommenting and filling:

```toml
[[kv_namespaces]]
binding = "ANGELCARE_KV"
id = "your-kv-namespace-id"
```

3. Add the required Worker secrets:

```bash
npx wrangler secret put SHOPIFY_CLIENT_ID
npx wrangler secret put SHOPIFY_CLIENT_SECRET
npx wrangler secret put SHOPIFY_SHOP_DOMAIN
```

Use the `.myshopify.com` domain for `SHOPIFY_SHOP_DOMAIN`.

4. Deploy once to get the public HTTPS Worker URL:

```bash
npm run cloudflare:deploy
```

Wrangler prints a URL like:

```text
https://angelcare-shopify-api.YOUR-SUBDOMAIN.workers.dev
```

5. Store that URL as the Worker `APP_URL`:

```bash
npx wrangler secret put APP_URL
```

Paste the exact `https://...workers.dev` URL.

6. Also put that same URL in local `.env` as `APP_URL`, then generate and deploy the Shopify app config:

```bash
npm run shopify:config
shopify app config link
shopify app deploy
```

7. Deploy the Worker again after setting `APP_URL`:

```bash
npm run cloudflare:deploy
```

8. Protect the dashboard and admin APIs:

```bash
npx wrangler secret put DASHBOARD_PASSWORD
```

Use `DASHBOARD_USERNAME` from `wrangler.toml` as the browser username. The default is `admin`.

9. For a custom app, generate the store-specific install link in Shopify Dev Dashboard:

```text
Dev Dashboard -> App distribution -> Custom distribution -> angelcare4all.myshopify.com -> Generate link
```

Send that generated Shopify link to the store owner. Modern Shopify custom apps can't be installed with a generic `/admin/oauth/authorize` third-party link.

10. After the owner installs it, complete the OAuth callback once so the Worker can store the offline Admin API token in KV:

```text
https://angelcare-shopify-api.YOUR-SUBDOMAIN.workers.dev/install
```

11. Open the protected dashboard:

```text
https://angelcare-shopify-api.YOUR-SUBDOMAIN.workers.dev/dashboard
```

Public routes are limited to Shopify OAuth callback/webhook ingestion, storefront traffic collection, and a minimal health check. Dashboard pages, Shopify data APIs, webhook logs, and inventory adjustments require dashboard authentication.

## Security

Secrets live in `.env`, which is intentionally ignored by Git. Use `.env.example` as the template.

If `SHOPIFY_ACCESS_TOKEN` is blank, the app falls back to public storefront products. After OAuth install succeeds, Admin API sections unlock for orders, customers, abandoned checkouts, inventory, and reports depending on granted scopes.

Payment payout metrics require `read_shopify_payments_payouts`. That scope is intentionally not requested in the default install URL because Shopify can reject the install unless the app and store are allowed to grant it.

Dev Dashboard custom distribution links can include `no_redirect=true`. In that mode, Shopify installs the app without calling the local OAuth callback. This backend still needs an authorization-code callback to store an Admin API token, so `/install` generates an authorize URL without a dynamic `scope` parameter and lets Shopify use the app's deployed scope configuration.

## Storefront Traffic

Page views, visitors, sessions, top pages, and referrers come from the local traffic collector, not the Shopify Admin order/product queries.

Add this script to the Shopify storefront theme after this API is reachable from the public internet:

```html
<script src="https://YOUR-PUBLIC-API-DOMAIN/api/traffic/script.js" defer></script>
```

For local testing only, post a synthetic event:

```bash
curl -X POST http://localhost:8100/api/traffic/collect \
  -H 'Content-Type: application/json' \
  -d '{"eventType":"page_view","visitorId":"dev-visitor","sessionId":"dev-session","path":"/","title":"Home"}'
```
