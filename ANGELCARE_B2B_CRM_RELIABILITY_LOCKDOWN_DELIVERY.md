# AngelCare B2B Marketplace CRM — Reliability Lockdown

This patch cleans the CRM Command Center and devis flow after rapid prototyping.

## Locked fixes
- Removes dependency on runtime text hacks by overwriting route layouts.
- Uses clean component-level white text in the CRM hero only.
- Restores status cards, filters and body text to dark readable colors.
- Standardizes CRM dossier data with canonical request and line shapes.
- Makes quote lines use `unitPriceMad`, `totalMad` and synchronized request totals.
- Makes edit/save/delete line actions write both `unit_price_mad` and `total_mad`.
- Makes the A4 devis route read the same normalized dossier API as the admin editor.
- Makes print open `/devis-b2b/[id]` outside the protected admin shell.
- Removes inline print CSS from the dossier action component.

## SQL
Run `20260703173000_b2b_marketplace_crm_reliability_lockdown.sql` in Supabase or use `npx supabase db push`.
