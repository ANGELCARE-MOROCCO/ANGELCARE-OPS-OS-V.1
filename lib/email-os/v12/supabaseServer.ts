import { createClient } from '@supabase/supabase-js';

export function createEmailOSV12Supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars for Email OS V12');
  return createClient(url, key, { auth: { persistSession: false } });
}
