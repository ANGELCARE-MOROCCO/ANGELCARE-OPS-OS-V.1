import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

const ACTIONS: Record<string, { field: 'outbound_paused' | 'automation_paused' | 'campaigns_paused'; value: boolean }> = {
  pause_outbound: { field: 'outbound_paused', value: true },
  resume_outbound: { field: 'outbound_paused', value: false },
  pause_automation: { field: 'automation_paused', value: true },
  resume_automation: { field: 'automation_paused', value: false },
  pause_campaigns: { field: 'campaigns_paused', value: true },
  resume_campaigns: { field: 'campaigns_paused', value: false },
}

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.analytics.view')
  if ('error' in context) return context.error
  const result = await context.supabase.from('ac_whatsapp_runtime_controls').select('*').eq('control_key','global').maybeSingle()
  if (result.error) return fail(result.error.message,500)
  return ok(result.data || { control_key:'global', outbound_paused:false, automation_paused:false, campaigns_paused:false })
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.security.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(()=>({}))
  const action = String(body.action || '')
  const reason = String(body.reason || '').trim()
  const command = ACTIONS[action]
  if (!command) return fail('INVALID_CONTROL_ACTION',422)
  if (!reason) return fail('CONTROL_REASON_REQUIRED',422)
  const before = await context.supabase.from('ac_whatsapp_runtime_controls').select('*').eq('control_key','global').maybeSingle()
  if (before.error) return fail(before.error.message,500)
  const patch = { [command.field]: command.value, reason, updated_by: context.user.id, updated_at: new Date().toISOString() }
  const result = await context.supabase.from('ac_whatsapp_runtime_controls').upsert({ control_key:'global', ...patch }, { onConflict:'control_key' }).select('*').single()
  if (result.error) return fail(result.error.message,500)
  await audit(context,{ action:`runtime.${action}`,entityType:'runtime_control',entityId:'global',reason,previousState:before.data,newState:result.data })
  return ok(result.data)
}
