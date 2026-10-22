# JOBKIX source authority and integration decisions

Baseline: `d655c0f99c8891deb08471bc0e83f5d0cfb1fa89`, branch `upgrade/next-angelcare-upgrade`. The working checkout is authoritative. Existing untracked KidFlix delivery materials are preserved. No release operation is authorized for this mission.

The user confirmed that the pasted 33-section execution contract is the governing build contract. The supplied 37-page PDF and engineering Markdown are supporting authorities. The immutable reference copies, SHA-256 values, archive entries, P00–P26 bindings and discrepancy decisions are in `reference-registry.json`. Folder 23 is secondary P15; P22 follows the support article grammar. Proposed `/careers` paths and three-language planning in the older blueprint yield to `/jobkix/{locale}` and seven languages in the execution mandate.

| Authority | Inspected source | JOBKIX decision |
|---|---|---|
| Public identity | `lib/supabase/server.ts`, `customer-commerce/customer-auth.ts` | Reuse Supabase Auth and `createUserClient`; do not call customer registration/context, which initializes commerce/family records. No second password store. |
| Session refresh | `proxy.ts`, `customer-commerce/customer-session-proxy.ts` | Add a scoped JOBKIX adapter that refreshes the same identity cookies, overwrites request context and fails closed in pages/APIs. Preserve existing matchers and behavior. |
| Internal operations identity | `auth/context.ts`, `app/angelcare-marketplace/(protected)/admin/layout.tsx` | Existing Marketplace admin layout/authorization remains authoritative. JOBKIX admin pages inherit the shell; recruitment commands are audited and capability scoped. |
| Public chrome | `public-universe/components/GlobalPublicShell.tsx`, `kidflix/MarketplaceEntry.tsx` | Add only the explicit physical-right brand shortcut. Keep the twelve storefronts and Marketplace footer unchanged. |
| Country | `visitor-country/lookup.ts`, public country route, packaged flags | Reuse approximate lookup and existing flags with DB-IP attribution. Keep detected country, selected origin, destination, locale and timezone independent. Unknown remains unknown. |
| Localization | existing localization migration `20260731203000` | Existing French-source constraints remain intact. JOBKIX gets an English-source edition boundary with seven target locales and explicit revision/freshness. |
| Recruitment | source migration search found internal `hr_opening_jobs`, `hr_candidates`, `hr_recruitment_candidates` | Internal HR records are not public recruitment records. Add dedicated recruitment tables; no catalogue, SKU, order, booking or checkout dependency. |
| Global browser persistence | `GlobalLocalStoragePersistenceBridge.tsx` | JOBKIX drafts must not enter managed global storage. Use account-authorized server drafts. Isolate unrelated root bridges on JOBKIX routes. |
| Root language | `app/layout.tsx` currently sets English | Add narrowly validated JOBKIX language/direction from an overwritten request header; preserve non-JOBKIX output. |
| Private media | source storage/auth adapters | Private uploads require owned records, readiness/scanning and current authorization on each download. No public bearer URL as private access authority. |

This is a source audit. No production database/schema introspection, SQL, storage-policy mutation, live publication or release was performed. Additive SQL must preflight its required existing objects and be exercised in a separately designated isolated database before database authorization acceptance.

Shared changes are registered with original-byte checkpoints in `shared-file-register.json` before editing. New source remains under additive JOBKIX routes, domain, assets, tests, documentation and migrations. Existing homepage/public experience, Studio, DCE, Families, Academy, commerce and KidFlix authorities are protected.

The three approved original brand files were located in Downloads on 2026-10-21 and preserved unchanged; see brand-register.json. Deterministic transparent derivatives and JOBKIX-native icon metadata are implemented, with browser lifecycle verification pending. Existing authorized browser/database test environments have not been identified. These dependencies block their corresponding acceptance checks while independent source implementation continues.
