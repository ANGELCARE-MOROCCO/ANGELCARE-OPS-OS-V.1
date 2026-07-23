import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getMissingSupabaseServerEnv, getSupabaseEnv } from './env'

async function cookieAdapter() {
  const cookieStore = await cookies()

  return {
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
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      } catch {
        // Server components can read cookies but cannot always mutate them.
      }
    },
  }
}

function assertBaseEnv() {
  const env = getSupabaseEnv()
  if (!env.url) {
    throw new Error('Missing Supabase server env value: NEXT_PUBLIC_SUPABASE_URL.')
  }
  return env
}

/**
 * User-scoped Supabase client. Use for Supabase Auth/RLS-aware requests only.
 * ANGELCARE custom app sessions are resolved separately through getCurrentUser().
 */
export async function createUserClient() {
  const env = assertBaseEnv()
  if (!env.anonKey) {
    throw new Error('Missing Supabase server env value: NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createServerClient(env.url, env.anonKey, { cookies: await cookieAdapter() })
}

/**
 * Explicit service-role client. This bypasses RLS and must only be used after
 * server-side actor, tenant and permission resolution.
 */
export async function createServiceClient() {
  const env = getSupabaseEnv()
  const missing = getMissingSupabaseServerEnv()

  if (missing.length) {
    throw new Error(
      `Missing Supabase server env values: ${missing.join(', ')}. Add them to .env.local from your Supabase project API settings.`,
    )
  }

  return createServerClient(env.url, env.serviceRoleKey, { cookies: await cookieAdapter() })
}

/** @deprecated Prefer createUserClient() or createServiceClient() explicitly. */
export async function createClient() {
  return createServiceClient()
}
