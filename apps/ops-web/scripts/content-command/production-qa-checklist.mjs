const checks = [
  'NEXT_PUBLIC_SUPABASE_URL exists',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY exists',
  'SUPABASE_SERVICE_ROLE_KEY exists server-side only',
  'OPENAI_API_KEY exists server-side only if AI enabled',
  'SQL migration reviewed',
  'RLS policies reviewed',
  'Audit write tested',
  'Asset list route tested',
  'Asset create route tested',
  'AI route tested',
  'Publishing queue tested',
  'Realtime event insert tested',
];

console.log('Content Command Center Production QA Checklist');
for (const check of checks) console.log(`- ${check}`);