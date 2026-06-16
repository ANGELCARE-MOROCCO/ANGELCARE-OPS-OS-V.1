import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import {
  loadRuntimeState,
  refreshRuntimeStateFromSchedule,
  isSystemRuntimeAuthorizedActor,
  type RuntimeActor,
  type SystemRuntimeState,
} from '@/lib/system-control/runtime'

export function getRuntimeActor(user: any): RuntimeActor {
  return {
    id: user?.id ? String(user.id) : null,
    email: String(user?.email || user?.work_email || user?.username || user?.login || '').trim().toLowerCase() || null,
    role: String(user?.role || user?.role_key || '').trim().toLowerCase() || null,
    permissions: Array.isArray(user?.permissions) ? user.permissions.map(String) : [],
  }
}

export async function getSystemControlContext() {
  const supabase = await createClient()
  const [user, runtimeState] = await Promise.all([
    getCurrentUser(),
    loadRuntimeState(supabase),
  ])

  const resolvedState = await refreshRuntimeStateFromSchedule(supabase, runtimeState)
  const actor = getRuntimeActor(user)
  const authorized = isSystemRuntimeAuthorizedActor(actor, resolvedState)

  return {
    supabase,
    user,
    actor,
    authorized,
    state: resolvedState,
  }
}

export type SystemControlContext = Awaited<ReturnType<typeof getSystemControlContext>>

export function buildStateEnvelope(state: SystemRuntimeState, actor: RuntimeActor | null) {
  return {
    ok: true,
    data: {
      state,
      currentOperator: actor?.email || state.lastActionBy || null,
      currentRole: actor?.role || null,
      modulePressure: Object.entries(state.disabledModules).map(([module, details]) => ({
        module,
        ...details,
      })),
      enabledCoreRoutes: state.enabledCoreRoutes,
    },
  }
}
