# HR V2 Page-by-Page Domination Pack

This is a non-destructive premium UI + manual execution upgrade for the existing `/hr` system.

It upgrades existing HR pages into command workspaces with:
- premium hero and KPI zones
- advanced filters/search
- subnavigation
- selectable tables
- bulk action placeholders
- right command panels
- roster matrix
- staff 360 panel
- forms and action queues
- safe compatibility SQL

## Install

From app root:

```bash
mv ~/Downloads/HR_V2_PAGE_BY_PAGE_DOMINATION_PACK.zip .
unzip HR_V2_PAGE_BY_PAGE_DOMINATION_PACK.zip -d HR_V2_PAGE_BY_PAGE_DOMINATION_PACK
cd HR_V2_PAGE_BY_PAGE_DOMINATION_PACK
bash INJECT_HR_V2_PAGE_BY_PAGE_DOMINATION.sh
cd ..
npm run dev
```

Then run in Supabase SQL Editor:

```txt
lib/supabase/migrations/018_hr_v2_page_by_page_domination.sql
```

## Test key pages

- /hr
- /hr/staff
- /hr/staff/new
- /hr/staff/seed1
- /hr/roster/monthly
- /hr/bulk-actions
- /hr/staff-control
- /hr/roster-control
- /hr/workflow-center
