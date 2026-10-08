import { createBrowserClient } from '@supabase/ssr'
import { wrapSupabaseClient } from './contract-safe'

export function createClient() {
  return wrapSupabaseClient(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))
}
