import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type AppUserRow = Record<string, unknown> & {
  id: string
  email?: string | null
  username?: string | null
  full_name?: string | null
  role?: string | null
  status?: string | null
  permissions?: unknown
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type SafeError = { code?: string | null; message?: string | null; details?: string | null }

const DELETE_PERMISSION_KEYS = new Set(['*', 'users.delete', 'admin.manage'])
const ADMIN_DELETE_ROLES = new Set(['ceo', 'direction', 'admin', 'super_admin', 'owner', 'root', 'root_admin'])
const PROTECTED_ADMIN_ROLES = new Set(['ceo', 'direction', 'admin', 'super_admin', 'owner', 'root', 'root_admin'])
const OWNER_ROLES = new Set(['owner', 'ceo', 'direction', 'root', 'root_admin'])
const TENANT_SCOPE_COLUMNS = ['tenant_id', 'team_id', 'company_id', 'organization_id', 'workspace_id']

function clean(value: unknown) {
  return String(value || '').trim()
}

function normalizeRole(value: unknown) {
  return clean(value).toLowerCase().replace(/[\s-]+/g, '_')
}

function permissionsFor(user: AppUserRow) {
  return Array.isArray(user.permissions) ? user.permissions.map(String) : []
}

function canDeleteUsers(user: AppUserRow) {
  const role = normalizeRole(user.role)
  const permissions = permissionsFor(user)
  return ADMIN_DELETE_ROLES.has(role) || permissions.some((permission) => DELETE_PERMISSION_KEYS.has(permission))
}

function isProtectedAdmin(user: AppUserRow) {
  return PROTECTED_ADMIN_ROLES.has(normalizeRole(user.role))
}

function isOwnerRole(user: AppUserRow) {
  return OWNER_ROLES.has(normalizeRole(user.role))
}

function isRetainedStatus(value: unknown) {
  const status = clean(value).toLowerCase()
  return !['deleted', 'archived', 'removed'].includes(status)
}

function confirmationMatches(confirmation: string, target: AppUserRow) {
  const email = clean(target.email).toLowerCase()
  const typed = confirmation.toLowerCase()
  return typed === 'delete' || Boolean(email && typed === email)
}

function response(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status })
}

function isForeignKeyError(error: SafeError) {
  return error.code === '23503' || clean(error.message).toLowerCase().includes('foreign key')
}

function isSchemaMissingError(error: SafeError) {
  const code = clean(error.code)
  const message = clean(error.message).toLowerCase()
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(code) || message.includes('does not exist') || message.includes('could not find')
}

function userSnapshot(user: AppUserRow) {
  return {
    id: user.id,
    email: user.email || null,
    username: user.username || null,
    full_name: user.full_name || null,
    role: user.role || null,
    status: user.status || null,
  }
}

async function assertProtectedAdminCanBeDeleted(supabase: SupabaseClient, target: AppUserRow) {
  if (!isProtectedAdmin(target)) return null

  const { data, error } = await supabase
    .from('app_users')
    .select('id, role, status')

  if (error) return 'Unable to validate protected administrator rules.'

  const protectedAdmins = ((data || []) as unknown as AppUserRow[]).filter((user) => isProtectedAdmin(user) && isRetainedStatus(user.status))

  if (protectedAdmins.length <= 1) {
    return 'Cannot delete the last Super Admin / Owner / Root Admin account.'
  }

  return null
}

async function assertTenantOwnerCanBeDeleted(supabase: SupabaseClient, target: AppUserRow) {
  if (!isOwnerRole(target)) return null

  for (const scopeColumn of TENANT_SCOPE_COLUMNS) {
    const scopeValue = target[scopeColumn]
    if (!scopeValue) continue

    const { data, error } = await supabase
      .from('app_users')
      .select(`id, role, status, ${scopeColumn}`)
      .eq(scopeColumn, scopeValue)

    if (error) return 'Unable to validate tenant ownership protection.'

    const remainingOwners = ((data || []) as unknown as AppUserRow[]).filter((user) => isOwnerRole(user) && isRetainedStatus(user.status))
    if (remainingOwners.length <= 1) return 'Cannot delete the last owner of this tenant or team.'
  }

  return null
}

async function unlinkHrStaffProfiles(supabase: SupabaseClient, userId: string, timestamp: string) {
  const payload = { app_user_id: null, updated_at: timestamp }
  const { error } = await supabase
    .from('hr_staff_profiles')
    .update(payload)
    .eq('app_user_id', userId)

  if (!error) return null
  if (isSchemaMissingError(error)) {
    const retry = await supabase
      .from('hr_staff_profiles')
      .update({ app_user_id: null })
      .eq('app_user_id', userId)

    if (!retry.error || isSchemaMissingError(retry.error)) return null
  }
  return 'Deletion failed while unlinking HR staff profile records.'
}

async function insertAuditEvent(supabase: SupabaseClient, actor: AppUserRow, target: AppUserRow, reason: string, timestamp: string) {
  const { error } = await supabase.from('app_audit_logs').insert([
    {
      actor_user_id: actor.id,
      action: 'user.permanently_deleted',
      target_table: 'app_users',
      target_id: target.id,
      details: {
        actor: {
          id: actor.id,
          email: actor.email || null,
          role: actor.role || null,
        },
        target: userSnapshot(target),
        reason: reason || null,
        timestamp,
        source: 'users_management',
      },
    },
  ])

  if (!error) return null
  return 'Deletion failed because audit logging is unavailable.'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const confirm = request.nextUrl.searchParams.get('confirm') || request.nextUrl.searchParams.get('confirmation')
  if (confirm !== 'DELETE') {
    return NextResponse.redirect(new URL(`/users/${id}?error=delete_requires_confirmation`, request.url))
  }
  return NextResponse.redirect(new URL(`/users/${id}?error=delete_requires_confirmation`, request.url))
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await getCurrentAppUser()
    if (!actor) return response('Authentication required.', 401)
    if (!canDeleteUsers(actor as AppUserRow)) return response('Permission denied. Your account is not allowed to permanently delete users.', 403)

    const { id } = await params
    const targetId = clean(id)
    if (!targetId) return response('User not found.', 404)

    const supabase = await createClient()
    const { data: target, error: targetError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', targetId)
      .maybeSingle()

    if (targetError) throw targetError
    if (!target) return response('User not found.', 404)

    const targetUser = target as AppUserRow
    if (actor.id === targetUser.id) return response('You cannot permanently delete your own account.', 400)

    const body = await request.json().catch(() => ({}))
    const confirmation = clean(body.confirmation)
    const reason = clean(body.reason)

    if (!confirmationMatches(confirmation, targetUser)) {
      return response('Type DELETE or the target user email to confirm permanent deletion.', 400)
    }

    const protectedAdminError = await assertProtectedAdminCanBeDeleted(supabase, targetUser)
    if (protectedAdminError) return response(protectedAdminError, 409)

    const tenantOwnerError = await assertTenantOwnerCanBeDeleted(supabase, targetUser)
    if (tenantOwnerError) return response(tenantOwnerError, 409)

    const timestamp = new Date().toISOString()

    const sessionDelete = await supabase.from('app_sessions').delete().eq('user_id', targetUser.id)
    if (sessionDelete.error) return response('Deletion failed while revoking active sessions.', 500)

    const unlinkError = await unlinkHrStaffProfiles(supabase, targetUser.id, timestamp)
    if (unlinkError) return response(unlinkError, 409)

    const auditError = await insertAuditEvent(supabase, actor as AppUserRow, targetUser, reason, timestamp)
    if (auditError) return response(auditError, 500)

    const { error: deleteError } = await supabase
      .from('app_users')
      .delete()
      .eq('id', targetUser.id)

    if (deleteError) {
      if (isForeignKeyError(deleteError)) {
        return response('This user cannot be deleted because linked records still require the account. Reassign or unlink those records first.', 409)
      }
      throw deleteError
    }

    return NextResponse.json({
      ok: true,
      deletedUserId: targetUser.id,
    })
  } catch (error) {
    console.error('[users.delete] Permanent user deletion failed', error)
    return response('Permanent user deletion failed. Please try again or contact an administrator.', 500)
  }
}
