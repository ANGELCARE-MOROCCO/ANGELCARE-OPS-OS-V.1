# HR V2 Final Core Completion Pack

Adds:
- `/hr/final-core`
- `/hr/sync-center`
- `/hr/intelligence`
- `/hr/payroll-prep`
- `/hr/compliance-center`
- safe data connector: `app/(protected)/hr/lib/final-core-data.ts`
- final migration: `014_hr_v2_final_core_completion.sql`

Run:
```bash
mv ~/Downloads/HR_V2_FINAL_CORE_COMPLETION_PACK.zip .
unzip HR_V2_FINAL_CORE_COMPLETION_PACK.zip -d HR_V2_FINAL_CORE_COMPLETION_PACK
cd HR_V2_FINAL_CORE_COMPLETION_PACK
bash INJECT_HR_V2_FINAL_CORE_COMPLETION.sh
cd ..
npm run dev
```

Run SQL in Supabase:
`lib/supabase/migrations/014_hr_v2_final_core_completion.sql`
