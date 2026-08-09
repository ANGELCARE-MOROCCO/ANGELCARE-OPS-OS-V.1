export function getAmbassadorEnvStatus() {
  return [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), required: true },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), required: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), required: true },
    { key: 'OPENAI_API_KEY', present: Boolean(process.env.OPENAI_API_KEY), required: false },
    { key: 'QUEUE_WORKER_SECRET', present: Boolean(process.env.QUEUE_WORKER_SECRET), required: false },
    { key: 'WEBHOOK_SIGNING_SECRET', present: Boolean(process.env.WEBHOOK_SIGNING_SECRET), required: false }
  ];
}

export function assertRequiredAmbassadorEnv(): void {
  const missing = getAmbassadorEnvStatus().filter((item) => item.required && !item.present);
  if (missing.length > 0) {
    throw new Error(`Missing required Ambassador OS env vars: ${missing.map((item) => item.key).join(', ')}`);
  }
}
