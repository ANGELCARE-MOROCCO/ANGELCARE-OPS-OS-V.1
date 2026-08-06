import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { normalizeRevenueOsError } from '@/lib/revenue-command-os/errors'
import { writeRevenueOsAuditEvent } from '@/lib/revenue-command-os/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok:false, error:{ code:'UNAUTHENTICATED', message:'Authentification requise.' } }, { status:401 })
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const actor = await resolveRevenueOsActor('revenue_os.manage', { aliases:['revenue_os.view'], payload:body })
    const client = await createServiceClient() as any
    const action = String(body.action || '')
    if (action === 'feature-flag') {
      const flagKey = String(body.flagKey || '').trim()
      if (!flagKey) return NextResponse.json({ ok:false, error:{ code:'FLAG_KEY_REQUIRED', message:'Clé de capacité obligatoire.' } }, { status:422 })
      const enabled = Boolean(body.enabled)
      const result = await client.from('revenue_os_feature_flags').update({ enabled, locked:false, updated_at:new Date().toISOString() }).eq('flag_key', flagKey).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action:'feature_flag.updated_live', actorId:actor.id, actorLabel:actor.displayName, actorType:'user', resourceType:'revenue_os_feature_flag', resourceId:flagKey, outcome:'success', summary:`Capacité ${flagKey} ${enabled?'activée':'désactivée'} par l’opérateur.`, metadata:{ tenantId:actor.tenantId, enabled } }, client)
      return NextResponse.json({ ok:true, data:result.data }, { headers:{ 'Cache-Control':'no-store' } })
    }
    if (action === 'enforce-live') {
      const result = await client.from('revenue_os_installations').update({ execution_mode:'live', contract_locked:false, external_actions_enabled:true, updated_at:new Date().toISOString() }).eq('installation_key','revenue-command-os').select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action:'runtime.live.enforced', actorId:actor.id, actorLabel:actor.displayName, actorType:'user', resourceType:'revenue_os_installation', resourceId:'revenue-command-os', outcome:'success', summary:'Runtime Revenue OS confirmé en mode LIVE.', metadata:{ tenantId:actor.tenantId } }, client)
      return NextResponse.json({ ok:true, data:result.data }, { headers:{ 'Cache-Control':'no-store' } })
    }
    return NextResponse.json({ ok:false, error:{ code:'INVALID_SETTINGS_ACTION', message:'Action de configuration invalide.' } }, { status:422 })
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    return NextResponse.json({ ok:false, error:{ code:normalized.code, message:normalized.message } }, { status:normalized.status || 500 })
  }
}
