# ANGELCARE Orders 360 · Commercial Order Studio R7
## Scope
- Sole visual authority: user-approved Commercial Order Studio 360 screenshot, 1648×960.
- Modal only. Existing admin sidebar, overhead panels, public storefronts and legacy assisted-order entry points unchanged.
- Orders 360 switches its composer import to a dedicated launcher.
- Six modes, eight operational tabs, customer lookup, canonical basket, dynamic line configurations, sticky commercial summary and bottom actions.
- Real numbers originate from canonical catalogue and the server-side quote engine; never hardcode example margin/tax/customer metrics.
## Required database and deployment
- Apply forward-only SQL file 20261114115500_angelcare_commercial_order_studio_r7.sql after remote rehearsal against the real production schema.
- SQL depends on the existing angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid) signature and order_lines table.
- No extra Docker service or supplier dependency.
- No secrets or additional Coolify environment variables are introduced.
## Validations
- Source/visual contracts, TypeScript, PostgreSQL grammar, protected-source gates.
- Before acceptance run real database migration rehearsal and create a controlled non-financial test order, verify one Journey plus N associated lines, server-calculated totals, idempotent retries, approvals and existing Orders 360 read-back.
- Receipt references, draft save, approval and financial amounts must come from server records.
## Known boundaries
- Service dates are requested, not confirmed staff allocations. Payment selection does not capture funds.
- Taxes and margin remain unavailable until actual tax/cost policies and verified data are connected.
- The approved screenshot contains illustrative customer information, figures and photoreal product imagery; the code must not invent this data.
- This release does not replace financial, documents, payment or scheduling authority.
