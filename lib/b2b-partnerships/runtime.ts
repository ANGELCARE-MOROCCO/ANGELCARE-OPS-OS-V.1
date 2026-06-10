/**
 * ANGELCARE B2B Partnerships Command Center runtime adapter.
 *
 * Server-only adapter wired to the existing ANGELCARE app runtime.
 * This file must never be imported from client components.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

export type B2BDatabaseClient = Awaited<ReturnType<typeof createClient>>

export type B2BCurrentAppUser = {
  id: string
  email?: string | null
  role?: string | null
  role_key?: string | null
  full_name?: string | null
  permissions?: string[] | null
}

export async function getServerB2BDatabaseClient(): Promise<B2BDatabaseClient> {
  return createClient()
}

export async function getCurrentB2BAppUser(): Promise<B2BCurrentAppUser | null> {
  const user = await getCurrentUser()

  if (!user?.id) {
    return null
  }

  return {
    id: String(user.id),
    email: (user as any).email ?? null,
    role: (user as any).role ?? (user as any).role_key ?? null,
    role_key: (user as any).role_key ?? null,
    full_name: (user as any).full_name ?? (user as any).name ?? null,
    permissions: Array.isArray((user as any).permissions) ? (user as any).permissions : null,
  }
}
