import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getMissingSupabaseServerEnv, getSupabaseEnv } from './env'

export async function createClient() {
  const cookieStore = await cookies()
  const env = getSupabaseEnv()
  const missing = getMissingSupabaseServerEnv()

  if (missing.length) {
    throw new Error(
      `Missing Supabase server env values: ${missing.join(', ')}. Add them to .env.local from your Supabase project API settings.`
    )
  }

  return createServerClient(
    env.url,
    env.serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: CookieOptions
          }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
