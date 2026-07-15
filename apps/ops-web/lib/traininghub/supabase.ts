import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function createTrainingHubUserClient() {
  const cookieStore = await cookies()
  const env = getSupabaseEnv()
  const missing = [
    env.url ? '' : 'NEXT_PUBLIC_SUPABASE_URL',
    env.anonKey ? '' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter((key): key is string => Boolean(key))

  if (missing.length) {
    throw new Error(
      `Missing TrainingHub Supabase auth env values: ${missing.join(', ')}. Add them to .env.local from your Supabase project API settings.`
    )
  }

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  })
}
