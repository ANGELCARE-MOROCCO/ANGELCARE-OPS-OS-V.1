import crypto from 'crypto'
import { openwa } from './openwa-client'

function externalId(sent: any) {
  return String(sent?.messageId?._serialized || sent?.messageId || sent?.id?._serialized || sent?.id || sent?._serialized || '') || null
}

function renderTemplate(body: string, context: Record<string, unknown>) {
  return String(body || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => String(context[key] ?? ''))
}

function parseClock(value: unknown, fallback: number) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''))
  if (!match) return fallback
  return Math.min(1439, Math.max(0, Number(match[1]) * 60 + Number(match[2])))
}

function outsideBusinessHours(config: any, now = new Date()) {
  const timezone = String(config?.timezone || 'Africa/Casablanca')
  let local = now
  try { local = new Date(now.toLocaleString('en-US', { timeZone: timezone })) } catch {}
  const weekdays = Array.isArray(config?.weekdays) ? config.weekdays.map(Number) : [1,2,3,4,5,6]
  if (!weekdays.includes(local.getDay())) return true
  const minute = local.getHours() * 60 + local.getMinutes()
  const start = parseClock(config?.start, 9 * 60)
  const end = parseClock(config?.end, 18 * 60)
  return minute < start || minute >= end
}

function textMatches(rule: any, body: string, contact: any, conversation: any, isNewConversation: boolean) {
  const conditions = rule.conditions || {}
  const lower = body.toLowerCase()
  const keywords = Array.isArray(conditions.keywords) ? conditions.keywords.map((value:any)=>String(value).trim().toLowerCase()).filter(Boolean) : []
  const containsAny = Array.isArray(conditions.contains_any) ? conditions.contains_any.map((value:any)=>String(value).trim().toLowerCase()).filter(Boolean) : []
  const containsAll = Array.isArray(conditions.contains_all) ? conditions.contains_all.map((value:any)=>String(value).trim().toLowerCase()).filter(Boolean) : []
  const tags = Array.isArray(conditions.contact_tags) ? conditions.contact_tags.map(String) : []
  if (keywords.length && !keywords.some((value:string)=>lower.includes(value))) return false
  if (containsAny.length && !containsAny.some((value:string)=>lower.includes(value))) return false
  if (containsAll.length && !containsAll.every((value:string)=>lower.includes(value))) return false
  if (tags.length && !tags.some((tag:string)=>(contact?.tags || []).includes(tag))) return false
  if (conditions.require_unassigned === true && conversation?.assigned_user_id) return false
  if (conditions.contact_type && String(contact?.contact_type || '') !== String(conditions.contact_type)) return false
  if (conditions.city && String(contact?.city || '').toLowerCase() !== String(conditions.city).toLowerCase()) return false
  if (rule.trigger_type === 'new_conversation' && !isNewConversation) return false
  if (rule.trigger_type === 'first_inbound' && Number(conversation?.message_count || 0) > 1) return false
  if (rule.trigger_type === 'keyword' && keywords.length === 0) return false
  if (rule.trigger_type === 'outside_business_hours' && !outsideBusinessHours(rule.schedule_config || conditions.business_hours || {})) return false
  return ['inbound_message','new_conversation','first_inbound','keyword','outside_business_hours'].includes(String(rule.trigger_type || ''))
}

export async function evaluateInboundAutomation(input: {
  supabase: any
  account: any
  conversation: any
  contact: any
  inboundMessageId: string
  inboundText: string
  isNewConversation: boolean
}) {
  const { supabase, account, conversation, contact } = input
  const control = await supabase.from('ac_whatsapp_runtime_controls').select('outbound_paused,automation_paused').eq('control_key','global').maybeSingle()
  if (control.error) throw control.error
  if (control.data?.outbound_paused) return { matched: false, reason: 'GLOBAL_OUTBOUND_PAUSED' }
  if (control.data?.automation_paused) return { matched: false, reason: 'GLOBAL_AUTOMATION_PAUSED' }
  if (conversation?.automation_paused) return { matched: false, reason: 'HUMAN_TAKEOVER_PAUSED' }

  const rules = await supabase.from('ac_whatsapp_automation_rules')
    .select('*,template:ac_whatsapp_templates(*)')
    .eq('status','active')
    .eq('approval_status','approved')
    .eq('test_mode',false)
    .order('priority',{ascending:true})
    .order('updated_at',{ascending:false})
    .limit(100)
  if (rules.error) throw rules.error

  for (const rule of rules.data || []) {
    if (rule.account_id && String(rule.account_id) !== String(account.id)) continue
    if (!textMatches(rule, input.inboundText, contact, conversation, input.isNewConversation)) continue
    const template = rule.template
    if (!template || template.status !== 'active' || template.approval_status !== 'approved') {
      await supabase.from('ac_whatsapp_automation_executions').insert({ rule_id: rule.id, conversation_id: conversation.id, contact_id: contact.id, message_id: input.inboundMessageId, execution_status: 'suppressed', evaluation: { reason: 'TEMPLATE_NOT_ACTIVE' } })
      continue
    }

    const cooldownSeconds = Math.max(0, Number(rule.cooldown_seconds || 0))
    if (cooldownSeconds) {
      const since = new Date(Date.now() - cooldownSeconds * 1000).toISOString()
      const recent = await supabase.from('ac_whatsapp_automation_executions').select('id',{count:'exact',head:true}).eq('rule_id',rule.id).eq('conversation_id',conversation.id).in('execution_status',['sent','matched']).gte('created_at',since)
      if (recent.error) throw recent.error
      if ((recent.count || 0) > 0) continue
    }
    const total = await supabase.from('ac_whatsapp_automation_executions').select('id',{count:'exact',head:true}).eq('rule_id',rule.id).eq('conversation_id',conversation.id).eq('execution_status','sent')
    if (total.error) throw total.error
    if ((total.count || 0) >= Math.max(1, Number(rule.max_runs_per_conversation || 1))) continue

    const text = renderTemplate(template.body, {
      contact_name: contact.display_name || contact.phone_number_e164 || '',
      first_name: contact.first_name || '',
      organization: contact.organization_name || '',
      city: contact.city || '',
      service: contact.contact_type || '',
      owner: '',
      operator_name: account.name || 'AngelCare',
    }).trim()
    if (!text) continue

    const clientMessageId = crypto.randomUUID()
    const now = new Date().toISOString()
    const message = await supabase.from('ac_whatsapp_messages').insert({
      account_id: account.id, conversation_id: conversation.id, contact_id: contact.id, client_message_id: clientMessageId,
      direction: 'outbound', message_type: 'text', body: text, status: 'processing', sender_user_id: null,
      sender_display_name_snapshot: `Automatisation · ${rule.name}`, sender_role_snapshot: 'Réponse automatique', sender_type: 'automation',
      message_origin: 'automation_rule', automation_name_snapshot: rule.name, recipient_whatsapp_id: conversation.remote_chat_id, created_at: now,
    }).select('*').single()
    if (message.error) throw message.error
    const outbox = await supabase.from('ac_whatsapp_outbox').insert({
      client_message_id: clientMessageId, account_id: account.id, conversation_id: conversation.id, contact_id: contact.id,
      message_type:'text', chat_id: conversation.remote_chat_id, body:text, status:'processing', locked_by:'automation-direct', locked_at:now, attempt_count:1,
    }).select('*').single()
    if (outbox.error) throw outbox.error
    const execution = await supabase.from('ac_whatsapp_automation_executions').insert({
      rule_id:rule.id,conversation_id:conversation.id,contact_id:contact.id,message_id:input.inboundMessageId,execution_status:'matched',trigger_payload:{inbound_message_id:input.inboundMessageId,text:input.inboundText},evaluation:{rule:rule.code,priority:rule.priority},result:{outbound_message_id:message.data.id}
    }).select('*').single()
    if (execution.error) throw execution.error

    try {
      const sent = await openwa.sendText(account.openwa_session_id, conversation.remote_chat_id, text)
      const external = externalId(sent)
      const sentAt = new Date().toISOString()
      await Promise.all([
        supabase.from('ac_whatsapp_messages').update({status:'sent',external_message_id:external,sent_at:sentAt}).eq('id',message.data.id),
        supabase.from('ac_whatsapp_outbox').update({status:'sent',external_message_id:external,locked_at:null,locked_by:null}).eq('id',outbox.data.id),
        supabase.from('ac_whatsapp_automation_executions').update({execution_status:'sent',result:{outbound_message_id:message.data.id,external_message_id:external}}).eq('id',execution.data.id),
        supabase.from('ac_whatsapp_automation_rules').update({run_count:Number(rule.run_count || 0)+1,last_run_at:sentAt,updated_at:sentAt}).eq('id',rule.id),
        supabase.from('ac_whatsapp_conversations').update({status:'waiting_customer',last_message_preview:text.slice(0,240),last_message_direction:'outbound',last_message_at:sentAt,last_message_sender_display_name_snapshot:`Automatisation · ${rule.name}`,last_message_sender_type:'automation',message_count:Number(conversation.message_count || 0)+1,unread_count:0,updated_at:sentAt}).eq('id',conversation.id),
      ])
      return { matched: true, ruleId: rule.id, executionId: execution.data.id, externalMessageId: external }
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : 'AUTOMATION_SEND_FAILED'
      await Promise.all([
        supabase.from('ac_whatsapp_messages').update({status:'failed',error_message:error}).eq('id',message.data.id),
        supabase.from('ac_whatsapp_outbox').update({status:'failed',last_error:error,locked_at:null,locked_by:null}).eq('id',outbox.data.id),
        supabase.from('ac_whatsapp_automation_executions').update({execution_status:'failed',error_message:error}).eq('id',execution.data.id),
      ])
      return { matched: true, ruleId: rule.id, executionId: execution.data.id, error }
    }
  }
  return { matched: false, reason: 'NO_RULE_MATCHED' }
}

export function simulateAutomationRule(rule: any, input: { text?: string; contact?: any; conversation?: any; isNewConversation?: boolean }) {
  const matched = textMatches(rule, String(input.text || ''), input.contact || {}, input.conversation || {}, Boolean(input.isNewConversation))
  return { matched, trigger_type: rule.trigger_type, priority: rule.priority, test_mode: rule.test_mode, status: rule.status, approval_status: rule.approval_status }
}
