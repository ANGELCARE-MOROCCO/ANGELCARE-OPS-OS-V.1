import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import UserEditGovernanceStudio from '@/app/(protected)/users/[id]/edit/_components/UserEditGovernanceStudio'
import {
  ROLE_PERMISSION_TEMPLATES,
  USER_ROLE_OPTIONS,
  getRoleOption,
} from '@/lib/auth/permissions'
import {
  readUserProfilePhoto,
  removeUserProfilePhoto,
  uploadUserProfilePhoto,
  validateUserProfilePhoto,
} from '@/lib/users/profile-photo'

type AnyRow = Record<string, any>

async function readList(supabase: any, table: string, columns = '*') {
  try {
    const { data, error } = await supabase.from(table).select(columns).limit(300)
    if (error) return [] as AnyRow[]
    return (data || []) as AnyRow[]
  } catch {
    return [] as AnyRow[]
  }
}

function uniqueValues(rows: AnyRow[], keys: string[], fallback: string[]) {
  const values = new Set<string>()
  rows.forEach((row) => keys.forEach((key) => {
    const value = String(row?.[key] || '').trim()
    if (value) values.add(value)
  }))
  fallback.forEach((value) => values.add(value))
  return [...values].sort((a, b) => a.localeCompare(b))
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager'])

  const { id } = await params
  const supabase = await createClient()

  const [{ data: user, error }, users, staff, departmentsTable, positionsTable] = await Promise.all([
    supabase.from('app_users').select('*').eq('id', id).maybeSingle(),
    readList(supabase, 'app_users', 'id,full_name,username,email,role,department,job_title,status'),
    readList(supabase, 'hr_staff_profiles', 'id,full_name,email,department,position,job_title,status'),
    readList(supabase, 'hr_departments', 'id,name,title,department,status'),
    readList(supabase, 'hr_positions', 'id,title,name,position,department,status'),
  ])

  if (error || !user) notFound()

  const permissions: string[] = Array.isArray(user.permissions) ? user.permissions : []
  const existingPermissions = [...permissions]
  const existingPhotoPath = String((user as AnyRow).profile_photo_path || '')
  const existingPhotoUrl = existingPhotoPath
    ? `/api/users/${encodeURIComponent(id)}/profile-photo?v=${encodeURIComponent(String(user.updated_at || '1'))}`
    : null

  const departments = uniqueValues(
    [...users, ...staff, ...departmentsTable, user],
    ['department', 'name', 'title'],
    ['Direction', 'Administration', 'Human Resources', 'Operations', 'Marketing', 'Sales', 'Finance', 'Academy', 'Customer Success', 'Field Staff'],
  )
  const positions = uniqueValues(
    [...users, ...staff, ...positionsTable, user],
    ['job_title', 'position', 'title', 'name'],
    ['CEO', 'Manager', 'HR Manager', 'Operations Manager', 'Marketing Officer', 'Sales Agent', 'Finance Officer', 'Academy Trainer', 'Session Leader', 'Caregiver'],
  )

  async function updateUser(formData: FormData) {
    'use server'

    await requireRole(['ceo', 'manager'])
    const supabase = await createClient()

    const profilePhoto = readUserProfilePhoto(formData)
    validateUserProfilePhoto(profilePhoto)
    const removeProfilePhoto = String(formData.get('remove_profile_photo') || 'false') === 'true'

    const role = String(formData.get('role') || 'staff').trim().toLowerCase()
    const catalogState = String(formData.get('permissions_catalog_state') || '')
    if (catalogState !== 'ready') {
      throw new Error('Permission catalog is not ready. Refresh Permission Control or run App Access Scan.')
    }

    const permissions = Array.from(new Set(formData.getAll('permissions').map(String).filter(Boolean)))
    const roleOption = getRoleOption(role)

    const payload: Record<string, unknown> = {
      full_name: String(formData.get('full_name') || ''),
      username: String(formData.get('username') || '').trim().toLowerCase(),
      role,
      status: String(formData.get('status') || 'active'),
      language: String(formData.get('language') || 'fr'),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || ''),
      department: String(formData.get('department') || roleOption?.department || ''),
      job_title: String(formData.get('job_title') || ''),
      permissions,
      updated_at: new Date().toISOString(),
    }

    let uploadedPhotoPath: string | null = null
    let nextPhotoPath: string | null = existingPhotoPath || null
    const photoChanged = Boolean(profilePhoto || removeProfilePhoto)

    try {
      if (profilePhoto) {
        uploadedPhotoPath = await uploadUserProfilePhoto(supabase, id, profilePhoto)
        nextPhotoPath = uploadedPhotoPath
        payload.profile_photo_path = uploadedPhotoPath
      } else if (removeProfilePhoto) {
        nextPhotoPath = null
        payload.profile_photo_path = null
      }

      const { error } = await supabase.from('app_users').update(payload).eq('id', id)
      if (error) throw new Error(error.message)

      if (photoChanged && existingPhotoPath && existingPhotoPath !== nextPhotoPath) {
        await removeUserProfilePhoto(supabase, existingPhotoPath).catch(() => undefined)
      }
    } catch (updateError) {
      if (uploadedPhotoPath) {
        await removeUserProfilePhoto(supabase, uploadedPhotoPath).catch(() => undefined)
      }
      throw updateError
    }

    await supabase.from('app_audit_logs').insert([
      {
        actor_user_id: null,
        action: 'update_user_permissions',
        target_table: 'app_users',
        target_id: id,
        details: {
          username: payload.username,
          role: payload.role,
          department: payload.department,
          permissions_before_count: existingPermissions.length,
          permissions_after_count: permissions.length,
          profile_photo_changed: photoChanged,
          profile_photo_present: Boolean(nextPhotoPath),
        },
      },
    ])

    redirect(`/users/${id}`)
  }

  return (
    <AppShell
      hideSidebar
      title={`Gouvernance · ${user.full_name}`}
      subtitle="Contrôle de l’identité, du compte, des permissions et de l’impact sur l’environnement SANILA."
      breadcrumbs={[
        { label: 'Administration', href: '/users' },
        { label: 'Utilisateurs', href: '/users' },
        { label: user.full_name, href: `/users/${user.id}` },
        { label: 'Gouvernance' },
      ]}
      actions={<PageAction href={`/users/${user.id}`} variant="light">Retour au dossier membre</PageAction>}
    >
      <UserEditGovernanceStudio
        action={updateUser}
        user={{
          id: String(user.id),
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          department: user.department,
          job_title: user.job_title,
          role: user.role,
          status: user.status,
          language: user.language,
          updated_at: user.updated_at,
        }}
        roles={USER_ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label, department: role.department }))}
        departments={departments}
        positions={positions}
        defaultPermissions={permissions}
        roleTemplates={ROLE_PERMISSION_TEMPLATES}
        existingPhotoUrl={existingPhotoUrl}
      />
    </AppShell>
  )
}
