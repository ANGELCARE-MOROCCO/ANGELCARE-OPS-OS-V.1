import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

function slug(value: unknown) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.view')
  if ('error' in context) return context.error
  const result = await context.supabase.from('ac_whatsapp_response_categories').select('*').order('display_order').order('name')
  if (result.error) return fail(result.error.message, 500)
  return ok(result.data || [])
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  if (!String(body.name || '').trim()) return fail('CATEGORY_NAME_REQUIRED', 422)
  const payload = {
    code: slug(body.code || body.name), name: String(body.name).trim(), description: String(body.description || '').trim() || null,
    icon_key: String(body.icon_key || 'message-square-text'), color: String(body.color || '#0f172a'), parent_id: body.parent_id || null,
    owner_user_id: body.owner_user_id || context.user.id, permitted_roles: Array.isArray(body.permitted_roles) ? body.permitted_roles.map(String) : [],
    permitted_account_ids: Array.isArray(body.permitted_account_ids) ? body.permitted_account_ids.map(String) : [], status: body.status || 'active',
    display_order: Number(body.display_order || 100), created_by: context.user.id, updated_by: context.user.id,
  }
  const result = await context.supabase.from('ac_whatsapp_response_categories').insert(payload).select('*').single()
  if (result.error) return fail(result.error.message, 500)
  await audit(context, { action: 'response_category.create', entityType: 'response_category', entityId: result.data.id, newState: result.data })
  return ok(result.data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({})); const id = String(body.id || '')
  if (!id) return fail('CATEGORY_ID_REQUIRED', 422)
  const current = await context.supabase.from('ac_whatsapp_response_categories').select('*').eq('id', id).maybeSingle()
  if (current.error) return fail(current.error.message, 500); if (!current.data) return fail('CATEGORY_NOT_FOUND', 404)
  const patch: Record<string, unknown> = { updated_by: context.user.id, updated_at: new Date().toISOString() }
  if (body.action === 'archive') patch.status = 'archived'
  if (body.action === 'restore') patch.status = 'active'
  for (const key of ['name','description','icon_key','color','parent_id','owner_user_id','status','display_order']) if (key in body) patch[key] = body[key] || (key === 'description' || key === 'parent_id' ? null : body[key])
  if ('code' in body || 'name' in body) patch.code = slug(body.code || body.name || current.data.code)
  if ('permitted_roles' in body) patch.permitted_roles = Array.isArray(body.permitted_roles) ? body.permitted_roles.map(String) : []
  if ('permitted_account_ids' in body) patch.permitted_account_ids = Array.isArray(body.permitted_account_ids) ? body.permitted_account_ids.map(String) : []
  const result = await context.supabase.from('ac_whatsapp_response_categories').update(patch).eq('id', id).select('*').single()
  if (result.error) return fail(result.error.message, 500)
  await audit(context, { action: `response_category.${body.action || 'update'}`,  entityType: 'response_category', entityId: id, previousState: current.data, newState: result.data })
  return ok(result.data)
}

export async function DELETE(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({})); const id = String(body.id || '')
  if (!id) return fail('CATEGORY_ID_REQUIRED', 422)
  const linked = await context.supabase.from('ac_whatsapp_templates').select('id', { count: 'exact', head: true }).eq('category_id', id).neq('status', 'archived')
  if (linked.error) return fail(linked.error.message, 500)
  if ((linked.count || 0) > 0) return fail('CATEGORY_HAS_ACTIVE_RESPONSES', 409, { activeResponses: linked.count })
  const result = await context.supabase.from('ac_whatsapp_response_categories').update({ status: 'archived', updated_by: context.user.id, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (result.error) return fail(result.error.message, 500)
  await audit(context, { action: 'response_category.archive', entityType: 'response_category', entityId: id, newState: result.data })
  return ok(result.data)
}
