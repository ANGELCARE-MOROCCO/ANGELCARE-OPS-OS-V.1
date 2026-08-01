# Handover

Delivery root: `apps/ops-web/angelcare-marketplace/homepage-flagship`.
Migration: `20260801210000_angelcare_marketplace_homepage_flagship_storefront.sql`.
Rollback: `20260801210000_HOMEPAGE_FLAGSHIP_SAFE_ROLLBACK.sql`.
Targeted gate: `tsconfig.angelcare-marketplace-homepage-flagship.json`.
Verifier: `scripts/angelcare-marketplace/verify-homepage-flagship.mjs`.

Apply source first, pass verifier and TypeScript, then apply SQL manually. No deployment is authorized.
