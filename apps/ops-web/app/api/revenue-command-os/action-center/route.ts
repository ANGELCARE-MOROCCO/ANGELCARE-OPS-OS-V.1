import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { normalizeRevenueOsError } from '@/lib/revenue-command-os/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok:false, error:{ code:'UNAUTHENTICATED', message:'Authentification requise.' } }, { status:401 })
    const actor = await resolveRevenueOsActor('revenue_os.view', { aliases:['revenue_os.manage'] })
    const client = await createServiceClient() as any
    let query = client.from('revenue_os_audit_events').select('id,event_id,action,resource_type,resource_id,outcome,summary,metadata,created_at').order('created_at',{ascending:false}).limit(30)
    query = query.contains('metadata',{tenantId:actor.tenantId})
    const result = await query
    if (result.error) throw result.error
    const rows = (result.data || []).map((row:any) => ({
      id:`audit-${row.id}`,
      title:String(row.summary || row.action),
      workspace:String(row.resource_type || 'Revenue OS').replaceAll('_',' '),
      state:row.outcome === 'failure' ? 'failure' : row.outcome === 'pending' ? 'running' : row.outcome === 'blocked' ? 'failure' : 'success',
      step:String(row.action || 'Action Revenue OS'),
      progress:100,
      indeterminate:false,
      startedAt:row.created_at,
      updatedAt:row.created_at,
      completedAt:row.created_at,
      detail:row.resource_id ? `${row.resource_type}/${row.resource_id}` : row.resource_type,
      auditHref:'/revenue-command-os/audit',
      dismissible:true,
      serverPersisted:true,
    }))
    return NextResponse.json({ok:true,data:{rows,generatedAt:new Date().toISOString()}},{headers:{'Cache-Control':'no-store'}})
  } catch (error) {
    const normalized=normalizeRevenueOsError(error)
    return NextResponse.json({ok:false,error:{code:normalized.code,message:normalized.message}},{status:normalized.status||500})
  }
}
