# AngelCare External Modules

This directory contains standalone services that are versioned with the main app but intentionally isolated from the Next.js build.

## Shopify API module

Location: `modules/angelcare-shopify-api`

Run it separately:

```bash
cd modules/angelcare-shopify-api
npm install
cp .env.example .env
npm run dev
```

Default local URL: `http://localhost:8100`.

The main AngelCare Next.js app does not compile this module. The root `tsconfig.json` excludes `modules/` on purpose so Shopify-specific Vite, Cloudflare, and worker types cannot break the app build.
