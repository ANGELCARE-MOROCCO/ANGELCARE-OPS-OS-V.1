# SALES MODULE V30 - PACK 3 QUOTE, PRICING AND PAYMENT PROMISE DEPTH

## Inject order
1. Copy the `app/` folder into your app root.
2. Copy the SQL file into `supabase/migrations/`.
3. Run the SQL in Supabase SQL editor or through your migration workflow.
4. Restart dev server and open the new routes under `/sales`.

## New routes
- `/sales/quote-command`
- `/sales/package-recommender`
- `/sales/pricing-control`
- `/sales/margin-guard`
- `/sales/payment-promises`

## New depth added
- package recommendation engine
- quote/devis command system
- quote line simulation
- pricing guardrails
- margin/discount approval logic
- payment promise status logic
- quote risk scoring foundation

## SQL adds
- `sales_package_catalog`
- `sales_quote_headers`
- `sales_quote_lines`
- `sales_discount_approvals`
- `sales_package_recommendations`

This pack is sales-only and does not modify unrelated modules.
