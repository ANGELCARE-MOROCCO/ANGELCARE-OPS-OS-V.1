# HR V2 Full Connect Pack

This pack connects `/hr` to real AngelCare app data where available:

- app_users
- app_attendance_logs
- hr_staff_profiles
- hr_rosters
- hr_leave_requests
- hr_staff_documents
- hr_performance_reviews
- hr_certifications
- hr_disciplinary_actions
- hr_staff_notifications
- hr_approval_requests
- bd_tasks
- market_os_campaign_tasks
- market_os_ambassador_missions
- incidents / ac_incidents
- ac_training_cohorts
- ac_documents / ac_certifications / ac_performance_reviews
- missions when available

It is safe: missing tables are shown in a diagnostics panel instead of breaking the page.

## Install

From app root:

```bash
mv ~/Downloads/HR_V2_FULL_CONNECT_PACK.zip .
unzip HR_V2_FULL_CONNECT_PACK.zip -d HR_V2_FULL_CONNECT_PACK
cd HR_V2_FULL_CONNECT_PACK
bash INJECT_HR_V2_FULL_CONNECT.sh
cd ..
npm run dev
```

## Required SQL

Run this file in Supabase SQL Editor:

```txt
lib/supabase/migrations/011_hr_v2_full_connection.sql
```

Then test:

```txt
http://localhost:3000/hr
```
