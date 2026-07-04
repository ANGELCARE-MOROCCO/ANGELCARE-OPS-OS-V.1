# AngelCare B2B CRM — Edit / Save / Permanent Delete / A4 Devis Print Patch

Adds a production CRM fulfillment layer on the request dossier:

- Edit and save client identity, message and internal summary.
- Edit, add, save and permanently delete quote lines.
- Recalculate and sync request estimated total after line changes.
- Permanent request delete through existing API with cascade.
- A4 print-ready Devis template with corporate McKinsey/ISO-style document control.
- Print action also creates/updates a proposal, document trace and activity log.
- All mutations use Supabase-backed CRM APIs.

Install:

```bash
cd ~/Desktop/angelcare-opsos-app
unzip -oq ~/Downloads/angelcare-b2b-crm-devis-edit-print-sync-patch-20260703.zip -d .
rm -rf .next
npm run build
npm run dev
```

Run SQL manually in Supabase SQL Editor if not using db push:
`supabase/migrations/20260703162000_b2b_marketplace_crm_devis_edit_print_sync.sql`
