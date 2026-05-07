import { createClient } from '@/lib/supabase/server'

export async function db() {
  return createClient()
}
