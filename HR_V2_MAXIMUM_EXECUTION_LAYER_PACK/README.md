# HR V2 Maximum Execution Layer Pack

Adds a premium HR Workforce Command Center with deeper execution pages, heavy subnavigation, synchronization widgets, and compatibility tables.

## Install

From app root:

```bash
mv ~/Downloads/HR_V2_MAXIMUM_EXECUTION_LAYER_PACK.zip .
unzip HR_V2_MAXIMUM_EXECUTION_LAYER_PACK.zip -d HR_V2_MAXIMUM_EXECUTION_LAYER_PACK
cd HR_V2_MAXIMUM_EXECUTION_LAYER_PACK
bash INJECT_HR_V2_MAXIMUM_EXECUTION_LAYER.sh
cd ..
npm run dev
```

Then run in Supabase SQL Editor:

```txt
lib/supabase/migrations/015_hr_v2_maximum_execution_layer.sql
```

## New / upgraded routes

- /hr
- /hr/execution
- /hr/sync-control
- /hr/command-ops
- /hr/staff
- /hr/staff/new
- /hr/positions
- /hr/departments
- /hr/attendance
- /hr/roster
- /hr/roster/monthly
- /hr/leave
- /hr/replacements
- /hr/performance
- /hr/training
- /hr/incidents
- /hr/documents
- /hr/approvals
- /hr/compliance
- /hr/payroll-prep
- /hr/workforce-capacity
- /hr/memos
- /hr/settings

This pack does not delete existing HR tables. It adds compatibility tables and pages.
