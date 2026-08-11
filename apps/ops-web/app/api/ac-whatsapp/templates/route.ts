import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

function codeOf(value: unknown) { return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) }
function shortcutOf(value: unknown) { const raw = String(value || '').trim(); if (!raw) return null; return `/${raw.replace(/^\/+/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 60)}` }

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.view'); if ('error' in context) return context.error
  const url = new URL(request.url); const status = url.searchParams.get('status'); const categoryId = url.searchParams.get('category_id'); const q = String(url.searchParams.get('q') || '').toLowerCase()
  let query: any = context.supabase.from('ac_whatsapp_templates').select('*,category:ac_whatsapp_response_categories(*)').order('usage_count', { ascending: false }).order('updated_at', { ascending: false }).limit(1000)
  if (status) query = query.eq('status', status); if (categoryId) query = query.eq('category_id', categoryId)
  const result = await query; if (result.error) return fail(result.error.message, 500)
  let rows = result.data || []
  if (q) rows = rows.filter((row: any) => [row.name,row.body,row.shortcut,row.description,row.service_line,(row.tags||[]).join(' ')].some(v => String(v || '').toLowerCase().includes(q)))
  return ok(rows)
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.manage'); if ('error' in context) return context.error
  const b = await request.json().catch(() => ({})); if (!b.name || !b.body) return fail('NAME_BODY_REQUIRED', 422)
  const payload = { code: codeOf(b.code || b.name), name: String(b.name).trim(), category: String(b.category || 'general'), category_id: b.category_id || null,
    shortcut: shortcutOf(b.shortcut), description: String(b.description || '').trim() || null, service_line: String(b.service_line || '').trim() || null,
    scope: b.scope || 'organization', language: b.language || 'fr', body: String(b.body), variables: Array.isArray(b.variables) ? b.variables.map(String) : [],
    tags: Array.isArray(b.tags) ? b.tags.map(String) : [], attachment_preset: b.attachment_preset || null, status: b.status || 'draft', approval_status: b.approval_status || 'draft',
    created_by: context.user.id, updated_by: context.user.id }
  const result = await context.supabase.from('ac_whatsapp_templates').insert(payload).select('*').single(); if (result.error) return fail(result.error.message, 500)
  await context.supabase.from('ac_whatsapp_template_versions').insert({ template_id: result.data.id, version: 1, snapshot: result.data, change_reason: 'Création', created_by: context.user.id })
  await audit(context, { action: 'response.create', entityType: 'template', entityId: result.data.id, newState: result.data })
  return ok(result.data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.manage'); if ('error' in context) return context.error
  const b = await request.json().catch(() => ({})); const id = String(b.id || ''); if (!id) return fail('TEMPLATE_ID_REQUIRED', 422)
  if (b.action === 'approve' && !context.access.permissions.some((permission: string) => ['ac-whatsapp.responses.publish','ac-whatsapp.*','*'].includes(permission))) return fail('RESPONSE_PUBLISH_FORBIDDEN', 403)
  const current = await context.supabase.from('ac_whatsapp_templates').select('*').eq('id', id).maybeSingle(); if (current.error) return fail(current.error.message, 500); if (!current.data) return fail('TEMPLATE_NOT_FOUND', 404)
  const patch: any = { updated_by: context.user.id, updated_at: new Date().toISOString(), version: Number(current.data.version || 1) + 1 }
  for (const key of ['name','category','category_id','description','service_line','scope','language','body','attachment_preset','status','approval_status']) if (key in b) patch[key] = b[key] === '' ? null : b[key]
  if ('shortcut' in b) patch.shortcut = shortcutOf(b.shortcut); if ('tags' in b) patch.tags = Array.isArray(b.tags) ? b.tags.map(String) : []; if ('variables' in b) patch.variables = Array.isArray(b.variables) ? b.variables.map(String) : []
  if (b.action === 'approve') { patch.status = 'active'; patch.approval_status = 'approved'; patch.approved_by = context.user.id; patch.approved_at = new Date().toISOString() }
  if (b.action === 'archive') { patch.status = 'archived'; patch.archived_by = context.user.id; patch.archived_at = new Date().toISOString() }
  if (b.action === 'restore') { patch.status = 'draft'; patch.approval_status = 'draft'; patch.archived_by = null; patch.archived_at = null }
  const result = await context.supabase.from('ac_whatsapp_templates').update(patch).eq('id', id).select('*').single(); if (result.error) return fail(result.error.message, 500)
  await context.supabase.from('ac_whatsapp_template_versions').insert({ template_id: id, version: result.data.version, snapshot: result.data, change_reason: String(b.reason || b.action || 'Modification'), created_by: context.user.id })
  await audit(context, { action: `response.${b.action || 'update'}`, entityType: 'template', entityId: id, previousState: current.data, newState: result.data, reason: b.reason || null })
  return ok(result.data)
}

export async function DELETE(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.manage'); if ('error' in context) return context.error
  const b = await request.json().catch(() => ({})); const id = String(b.id || ''); if (!id) return fail('TEMPLATE_ID_REQUIRED', 422)
  const result = await context.supabase.from('ac_whatsapp_templates').update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: context.user.id, updated_by: context.user.id }).eq('id', id).select('*').single(); if (result.error) return fail(result.error.message, 500)
  await audit(context, { action: 'response.archive', entityType: 'template', entityId: id, newState: result.data })
  return ok(result.data)
}
