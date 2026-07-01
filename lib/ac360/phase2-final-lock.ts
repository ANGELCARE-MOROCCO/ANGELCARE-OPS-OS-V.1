import { createClient } from '@/lib/supabase/server'
import { getAc360CurrentContext } from './runtime'
import { runAc360WiredAction } from './action-wiring'

type JsonRecord = Record<string, unknown>

async function resolveOrgId(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  return {
    orgId: context.context?.org?.id || orgId,
    context,
  }
}

function unwrapRpc(data: unknown) {
  return data ?? { ok: true }
}

export async function getAc360Phase2UFinalLockDashboard(orgId?: string) {
  const db = await createClient()
  const { orgId: resolvedOrgId, context } = await resolveOrgId(orgId)
  const { ok: _contextOk, ...safeContext } = (context || {}) as Record<string, unknown>
  const { data, error } = await db.rpc('ac360_phase2u_final_lock_dashboard', { p_org_id: resolvedOrgId || null } as any)
  if (error) return { ...safeContext, ok: false, error: error.message }
  return { ...safeContext, ok: true, dashboard: unwrapRpc(data) }
}

export async function runAc360Phase2USqlCompatibilitySweep(input: { orgId?: string; metadata?: JsonRecord } = {}) {
  const { orgId } = await resolveOrgId(input.orgId)
  return runAc360WiredAction(
    'ac360.phase2u.sql_compatibility_sweep.run',
    async () => {
      const db = await createClient()
      const { data, error } = await db.rpc('ac360_run_phase2u_sql_compatibility_sweep', {
        p_org_id: orgId || null,
        p_metadata: { ...(input.metadata || {}), source: 'phase_2u_sql_compatibility_sweep_api' },
      } as any)
      if (error) throw new Error(error.message)
      return unwrapRpc(data)
    },
    { orgId, quantity: 1, metadata: { phase: 'phase_2u', operation: 'sql_compatibility_sweep' } },
  )
}

export async function evaluateAc360Phase2UFinalBackendLock(input: { orgId?: string; metadata?: JsonRecord } = {}) {
  const { orgId } = await resolveOrgId(input.orgId)
  return runAc360WiredAction(
    'ac360.phase2u.final_backend_lock.evaluate',
    async () => {
      const db = await createClient()
      const { data, error } = await db.rpc('ac360_evaluate_phase2u_final_backend_lock', {
        p_org_id: orgId || null,
        p_metadata: { ...(input.metadata || {}), source: 'phase_2u_final_backend_lock_api' },
      } as any)
      if (error) throw new Error(error.message)
      return unwrapRpc(data)
    },
    { orgId, quantity: 1, metadata: { phase: 'phase_2u', operation: 'final_backend_lock' } },
  )
}

export async function createAc360Phase2UReleaseManifest(input: { orgId?: string; metadata?: JsonRecord } = {}) {
  const { orgId } = await resolveOrgId(input.orgId)
  return runAc360WiredAction(
    'ac360.phase2u.release_manifest.create',
    async () => {
      const db = await createClient()
      const { data, error } = await db.rpc('ac360_create_phase2u_release_manifest', {
        p_org_id: orgId || null,
        p_metadata: { ...(input.metadata || {}), source: 'phase_2u_release_manifest_api' },
      } as any)
      if (error) throw new Error(error.message)
      return unwrapRpc(data)
    },
    { orgId, quantity: 1, metadata: { phase: 'phase_2u', operation: 'release_manifest_create' } },
  )
}

export async function createAc360Phase2UPreUiHandoff(input: { orgId?: string; metadata?: JsonRecord } = {}) {
  const { orgId } = await resolveOrgId(input.orgId)
  return runAc360WiredAction(
    'ac360.phase2u.pre_ui_handoff.create',
    async () => {
      const db = await createClient()
      const { data, error } = await db.rpc('ac360_create_phase2u_pre_ui_handoff', {
        p_org_id: orgId || null,
        p_metadata: { ...(input.metadata || {}), source: 'phase_2u_pre_ui_handoff_api' },
      } as any)
      if (error) throw new Error(error.message)
      return unwrapRpc(data)
    },
    { orgId, quantity: 1, metadata: { phase: 'phase_2u', operation: 'pre_ui_instruction_handoff' } },
  )
}

export async function resolveAc360Phase2UAlert(input: { orgId?: string; alertId?: string; alertKey?: string; resolutionNote?: string } = {}) {
  const { orgId } = await resolveOrgId(input.orgId)
  return runAc360WiredAction(
    'ac360.phase2u.alert.resolve',
    async () => {
      const db = await createClient()
      const { data, error } = await db.rpc('ac360_resolve_phase2u_alert', {
        p_org_id: orgId || null,
        p_alert_id: input.alertId || null,
        p_alert_key: input.alertKey || null,
        p_actor_id: null,
        p_resolution_note: input.resolutionNote || null,
      } as any)
      if (error) throw new Error(error.message)
      return unwrapRpc(data)
    },
    { orgId, quantity: 1, metadata: { phase: 'phase_2u', operation: 'alert_resolve', alertKey: input.alertKey } },
  )
}
