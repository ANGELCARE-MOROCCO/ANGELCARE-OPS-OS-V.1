import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { TrainingHubHttpError } from './auth'

export function createTrainingHubAdminClient() {
  const env = getSupabaseEnv()

  if (!env.url || !env.serviceRoleKey) {
    throw new TrainingHubHttpError(
      'TrainingHub admin client is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
      500,
      'TRAININGHUB_ADMIN_ENV_MISSING',
      {
        hasUrl: Boolean(env.url),
        hasServiceRoleKey: Boolean(env.serviceRoleKey),
      },
    )
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function findTrainingHubAuthUserByEmail(email: string) {
  const admin = createTrainingHubAdminClient()
  const normalized = String(email || '').trim().toLowerCase()

  if (!normalized) {
    throw new TrainingHubHttpError('Missing auth user email.', 400, 'TRAININGHUB_AUTH_EMAIL_REQUIRED')
  }

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_AUTH_USERS_LOOKUP_FAILED')
    }

    const user = data.users.find((item) => String(item.email || '').trim().toLowerCase() === normalized)
    if (user) return user

    if (!data.users.length || data.users.length < 1000) break
  }

  return null
}
