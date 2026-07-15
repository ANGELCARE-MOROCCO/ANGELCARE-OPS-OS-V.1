const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const serverOnly = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

for (const key of required) {
  console.log(`${key}: ${process.env[key] ? 'present' : 'missing'}`);
}

for (const key of serverOnly) {
  console.log(`${key}: ${process.env[key] ? 'present server-side' : 'missing or disabled'}`);
}