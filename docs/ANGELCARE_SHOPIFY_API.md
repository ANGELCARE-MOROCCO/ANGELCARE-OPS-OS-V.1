# AngelCare Shopify API

Dependency-free Shopify dashboard integration, mounted inside the Next.js app.

## Run

```bash
npm run dev
```

Default URLs:

- Dashboard: `http://localhost:3000/dashboard`
- Install OAuth: `http://localhost:3000/install`
- Health: `http://localhost:3000/health`
- Summary API: `http://localhost:3000/api/dashboard/summary`
- Traffic summary: `http://localhost:3000/api/traffic/summary`

The original standalone service code lives under `src/lib/shopify-api`. Next route handlers adapt those endpoints into the app:

- `app/dashboard/route.ts`
- `app/install/route.ts`
- `app/health/route.ts`
- `app/api/[...shopify]/route.ts`

## Security

Secrets live in `.env.local`, which is intentionally ignored by Git. Use `shopify.env.example` as the template.

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
