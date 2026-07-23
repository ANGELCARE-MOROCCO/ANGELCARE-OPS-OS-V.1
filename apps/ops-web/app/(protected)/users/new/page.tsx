import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import UserCreateCommandCenter from '@/app/(protected)/users/new/_components/UserCreateCommandCenter'
import {
  readUserProfilePhoto,
  removeUserProfilePhoto,
  uploadUserProfilePhoto,
  validateUserProfilePhoto,
} from '@/lib/users/profile-photo'
import {
  ROLE_PERMISSION_TEMPLATES,
  USER_ROLE_OPTIONS,
  getRoleOption,
} from '@/lib/auth/permissions'

type AnyRow = Record<string, any>

async function readList(supabase: any, table: string, columns = '*', orderColumn?: string) {
  try {
    let query = supabase.from(table).select(columns).limit(300)
    if (orderColumn) query = query.order(orderColumn, { ascending: true })
    const { data, error } = await query
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

export default async function NewUserPage() {
  await requireRole(['ceo', 'manager', 'admin'])
  const supabase = await createClient()

  const [users, staff, departmentsTable, positionsTable] = await Promise.all([
    readList(supabase, 'app_users', 'id,full_name,username,email,role,department,job_title,status'),
    readList(supabase, 'hr_staff_profiles', 'id,full_name,email,department,position,job_title,status'),
    readList(supabase, 'hr_departments', 'id,name,title,department,status'),
    readList(supabase, 'hr_positions', 'id,title,name,position,department,status'),
  ])

  const departments = uniqueValues(
    [...users, ...staff, ...departmentsTable],
    ['department', 'name', 'title'],
    ['Direction', 'Administration', 'Human Resources', 'Operations', 'Marketing', 'Sales', 'Finance', 'Academy', 'Customer Success', 'Field Staff'],
  )
  const positions = uniqueValues(
    [...users, ...staff, ...positionsTable],
    ['job_title', 'position', 'title', 'name'],
    ['CEO', 'Manager', 'HR Manager', 'Operations Manager', 'Marketing Officer', 'Sales Agent', 'Finance Officer', 'Academy Trainer', 'Session Leader', 'Caregiver'],
  )

  async function createUser(formData: FormData) {
    'use server'

    const actor = await requireRole(['ceo', 'manager', 'admin'])
    const supabase = await createClient()

    const password = String(formData.get('password') || '')
    if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.')

    const profilePhoto = readUserProfilePhoto(formData)
    validateUserProfilePhoto(profilePhoto)

    const role = String(formData.get('role') || 'staff').trim().toLowerCase()
    const catalogState = String(formData.get('permissions_catalog_state') || '')
    if (catalogState !== 'ready') {
      throw new Error('Permission catalog is not ready. Refresh Permission Control or run App Access Scan.')
    }

    const permissions = Array.from(new Set(formData.getAll('permissions').map(String).filter(Boolean)))
    const roleOption = getRoleOption(role)

    const { data: passwordHash, error: hashError } = await supabase.rpc('hash_app_password', { input_password: password })
    if (hashError) throw new Error(hashError.message)
    if (!passwordHash) throw new Error('Erreur génération mot de passe.')

    const payload = {
      full_name: String(formData.get('full_name') || '').trim(),
      username: String(formData.get('username') || '').trim().toLowerCase(),
      password_hash: passwordHash,
      role,
      status: String(formData.get('status') || 'active'),
      language: String(formData.get('language') || 'fr'),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || '').trim().toLowerCase(),
      department: String(formData.get('department') || roleOption?.department || ''),
      job_title: String(formData.get('job_title') || formData.get('position') || ''),
      created_by: actor.id,
      must_change_password: String(formData.get('must_change_password') || 'on') === 'on',
      permissions,
    }

    const { data: createdUser, error } = await supabase
      .from('app_users')
      .insert([payload])
      .select('id')
      .single()

    if (error || !createdUser?.id) throw new Error(error?.message || 'Impossible de créer le collaborateur.')

    let uploadedPhotoPath: string | null = null

    try {
      if (profilePhoto) {
        uploadedPhotoPath = await uploadUserProfilePhoto(supabase, String(createdUser.id), profilePhoto)
        const { error: photoUpdateError } = await supabase
          .from('app_users')
          .update({
            profile_photo_path: uploadedPhotoPath,
            updated_at: new Date().toISOString(),
          })
          .eq('id', createdUser.id)

        if (photoUpdateError) throw new Error(photoUpdateError.message)
      }

      await supabase.from('app_audit_logs').insert([{
        actor_user_id: actor.id,
        action: 'create_user',
        target_table: 'app_users',
        target_id: String(createdUser.id),
        details: {
          username: payload.username,
          role: payload.role,
          department: payload.department,
          permissions_count: permissions.length,
          profile_photo_attached: Boolean(uploadedPhotoPath),
          source: 'premium_users_module',
        },
      }])
    } catch (creationError) {
      if (uploadedPhotoPath) {
        await removeUserProfilePhoto(supabase, uploadedPhotoPath).catch(() => undefined)
      }
      await supabase.from('app_users').delete().eq('id', createdUser.id)
      throw creationError
    }

    redirect('/users')
  }

  return (
    <AppShell
      hideSidebar
      title="SANILA Identity Provisioning"
      subtitle="Émission contrôlée d’une identité AngelCare, de son compte initial et de son environnement opérationnel."
      breadcrumbs={[{ label: 'Administration', href: '/users' }, { label: 'Utilisateurs', href: '/users' }, { label: 'Nouvelle identité' }]}
      actions={<PageAction href="/users" variant="light">Retour au command center</PageAction>}
    >
      <UserCreateCommandCenter
        action={createUser}
        roles={USER_ROLE_OPTIONS.map((role) => ({
          value: role.value,
          label: role.label,
          department: role.department,
          defaultHome: 'defaultHome' in role ? String(role.defaultHome || '') : null,
        }))}
        departments={departments}
        positions={positions}
        roleTemplates={ROLE_PERMISSION_TEMPLATES}
      />
    </AppShell>
  )
}
