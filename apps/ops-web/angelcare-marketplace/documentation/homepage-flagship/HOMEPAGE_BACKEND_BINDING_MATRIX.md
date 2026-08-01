# Backend Binding Matrix

| Visible capability | Canonical authority | Homepage role |
|---|---|---|
| Sellable item | `angelcare_marketplace_catalog_items` | Read published records |
| Category | `angelcare_marketplace_catalog_categories` | Read published localized category |
| Item media | `angelcare_marketplace_catalog_item_media` | Responsive product/offer visual |
| Price | Canonical catalog price mode/amount, later Finance price-book resolution | Never hard-coded in JSX |
| Territory | Territory OS tables | Resolve MA-MASTER, cities and readiness |
| Academy | Academy courses/cohorts | Show only published courses and open/scheduled cohorts |
| Partner OS | Partner plans/modules | Show published plans and included modules |
| Trust | Trust badge issuances/definitions | Show only active public evidence |
| Saved/compare | Homepage visitor selections | Server-persisted anonymous selection |
| Analytics | Homepage interactions | Server-recorded evidence |
| Navigation | CMS public navigation view | No duplicate navigation authority |
