'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

type TrainingHubGlobal = typeof globalThis & {
  __angelcareTrainingHubBrowserClient?: SupabaseClient
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is missing for TrainingHub browser auth.`)
  }

  return value
}

/**
 * Single TrainingHub browser Supabase client.
 *
 * IMPORTANT:
 * This uses @supabase/ssr createBrowserClient, not @supabase/supabase-js createClient.
 * The old login used localStorage-only auth, while server pages read SSR cookies through
 * createServerClient. That mismatch caused:
 *
 *   login success -> /traininghub -> server sees no cookie -> /traininghub/login?error=session_required
 *
 * createBrowserClient writes the cookie format that createServerClient can read.
 */
export function getTrainingHubBrowserClient() {
  const g = globalThis as TrainingHubGlobal

  if (g.__angelcareTrainingHubBrowserClient) {
    return g.__angelcareTrainingHubBrowserClient
  }

  g.__angelcareTrainingHubBrowserClient = createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_ANON_KEY,
    ),
  )

  return g.__angelcareTrainingHubBrowserClient
}

export async function clearTrainingHubBrowserSession() {
  const supabase = getTrainingHubBrowserClient()

  try {
    await supabase.auth.signOut()
  } catch {
    // no-op
  }

  try {
    const keys = Object.keys(window.localStorage || {})
    keys.forEach((key) => {
      if (/supabase|sb-|traininghub|angelcare-traininghub-auth/i.test(key)) {
        window.localStorage.removeItem(key)
      }
    })
  } catch {
    // no-op
  }

  try {
    const keys = Object.keys(window.sessionStorage || {})
    keys.forEach((key) => {
      if (/supabase|sb-|traininghub|angelcare-traininghub-auth/i.test(key)) {
        window.sessionStorage.removeItem(key)
      }
    })
  } catch {
    // no-op
  }

  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim()
      if (!name) return
      if (!/^sb-/i.test(name) && !/supabase|auth-token|traininghub/i.test(name)) return
      document.cookie = `${name}=; Max-Age=0; path=/`
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    })
  } catch {
    // no-op
  }
}
