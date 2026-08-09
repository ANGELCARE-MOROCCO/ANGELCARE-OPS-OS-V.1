# Revenue Digital Twin Data Dictionary

## Portfolio domains

- `revenue_os_business_units`: revenue-producing AngelCare lines and ownership.
- `revenue_os_offer_families`: reusable product/service taxonomy.
- `revenue_os_offers`: commercial offer dossier and delivery requirements.
- `revenue_os_offer_versions`: governed offer version history.
- `revenue_os_offer_formats`: presentiel, e-learning, subscription, hourly, product or hybrid formats.
- `revenue_os_offer_bundles`: commercial packages and bundle-level margin posture.
- `revenue_os_offer_bundle_items`: ordered offer membership and prerequisite rules.
- `revenue_os_offer_relationships`: prerequisite, complement, entry, premium and retention links.

## Buyer intelligence

- `revenue_os_customer_segments`: organization archetypes, pains, triggers, objections and potential.
- `revenue_os_segment_needs`: normalized needs by segment.
- `revenue_os_segment_pain_points`: normalized commercial pains.
- `revenue_os_segment_offer_fit`: evidence-backed offer-to-segment fit.
- `revenue_os_decision_maker_profiles`: authority, concerns, motivations, evidence and contact strategy.

## Geography

- `revenue_os_regions`, `revenue_os_cities`, `revenue_os_territories`: geographic hierarchy.
- `revenue_os_markets`: commercial readiness by city/market.
- `revenue_os_offer_territory_availability`: promote/sell/deliver posture by offer and territory.

## Commercial journeys

- `revenue_os_sales_channels`: channel governance and measurement.
- `revenue_os_sales_journeys`: segment/offer journey definitions.
- `revenue_os_sales_journey_stages`: ordered commercial lifecycle stages.
- `revenue_os_stage_requirements`: entry, exit, evidence and recovery requirements.

## Pricing and margin protection

- `revenue_os_price_books`, `revenue_os_pricing_models`, `revenue_os_offer_prices`.
- `revenue_os_cost_models`, `revenue_os_margin_rules`, `revenue_os_discount_rules`.

Unknown financial data is intentionally nullable and creates validation gaps. Dh is the canonical displayed currency.

## Capacity and feasibility

- `revenue_os_capacity_types`: available, reserved and maximum capacity.
- `revenue_os_capacity_requirements`: capacity required by offer.
- `revenue_os_delivery_constraints`: operational restrictions.
- `revenue_os_revenue_dependencies`: hard/soft gates and recovery actions.

## Time and growth

- `revenue_os_seasonal_windows`: demand windows, urgency and lead time.
- `revenue_os_growth_paths`: generic cross-sell, upsell, renewal and referral graph.
- dedicated cross-sell/up-sell/renewal/referral tables reserve future specialization.

## Governance

- `revenue_os_digital_twin_validations`: validation runs and scores.
- `revenue_os_digital_twin_gaps`: actionable contradictions and missing data.
- `revenue_os_digital_twin_versions`: model snapshots.
- `revenue_os_digital_twin_change_log`: object changes.
- `revenue_os_model_owners`: domain accountability.
- `revenue_os_model_approval_requests`: controlled approval workflow.
