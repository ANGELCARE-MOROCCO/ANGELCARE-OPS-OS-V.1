import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { APP_ROUTE_PERMISSIONS } from '@/lib/generated/app-routes'
import SmartPermissionsPanel from '@/app/(protected)/users/_components/SmartPermissionsPanel'
import {
  MODULE_PERMISSIONS,
  USER_ROLE_OPTIONS,
  buildUserPermissionsForRole,
  getRoleOption,
} from '@/lib/auth/permissions'

const CORE_PERMISSIONS = Object.entries(MODULE_PERMISSIONS).flatMap(([moduleKey, permissions]) =>
  permissions.map((permission) => ({
    value: permission,
    label: permission,
    module: moduleKey,
  }))
)

const ROLE_OPTIONS = USER_ROLE_OPTIONS.map((role) => ({
  value: role.value,
  label: `${role.label} · ${role.department}`,
}))

export default async function NewUserPage() {
  await requireRole(['ceo', 'manager'])

  async function createUser(formData: FormData) {
    'use server'

    const actor = await requireRole(['ceo', 'manager'])
    const supabase = await createClient()

    const password = String(formData.get('password') || '')
    if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.')

    const role = String(formData.get('role') || 'staff').trim().toLowerCase()
    const selectedPermissions = Array.from(new Set(formData.getAll('permissions').map(String)))
    const permissions = buildUserPermissionsForRole(role, selectedPermissions)
    const roleOption = getRoleOption(role)

    const { data: passwordHash, error: hashError } = await supabase.rpc('hash_app_password', {
      input_password: password,
    })

    if (hashError) throw new Error(hashError.message)
    if (!passwordHash) throw new Error('Erreur génération mot de passe.')

    const payload = {
      full_name: String(formData.get('full_name') || ''),
      username: String(formData.get('username') || '').trim().toLowerCase(),
      password_hash: passwordHash,
      role,
      status: String(formData.get('status') || 'active'),
      language: String(formData.get('language') || 'fr'),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || ''),
      department: String(formData.get('department') || roleOption?.department || ''),
      job_title: String(formData.get('job_title') || ''),
      created_by: actor.id,
      must_change_password: true,
      permissions,
    }

    const { error } = await supabase.from('app_users').insert([payload])
    if (error) throw new Error(error.message)

    await supabase.from('app_audit_logs').insert([
      {
        actor_user_id: actor.id,
        action: 'create_user',
        target_table: 'app_users',
        details: {
          username: payload.username,
          role: payload.role,
          department: payload.department,
          permissions_count: permissions.length,
        },
      },
    ])

    redirect('/users')
  }

  return (
    <AppShell
      title="Créer utilisateur"
      subtitle="Création d’un compte interne avec rôle, permissions métier et accès exact aux pages."
      breadcrumbs={[{ label: 'Administration', href: '/users' }, { label: 'Nouvel utilisateur' }]}
      actions={<PageAction href="/users" variant="light">Retour</PageAction>}
    >
      <form action={createUser} style={pageGridStyle}>
        <main>
          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div style={eyebrowStyle}>Identité</div>
              <h2 style={sectionTitleStyle}>Informations utilisateur</h2>
            </div>

            <div style={gridStyle}>
              <Field name="full_name" label="Nom complet" />
              <Field name="username" label="Nom utilisateur" />
              <Field name="password" label="Mot de passe" type="password" />
              <Field name="phone" label="Téléphone" />
              <Field name="email" label="Email" />
              <Field name="job_title" label="Poste" />
            </div>
          </section>

          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div style={eyebrowStyle}>Accès</div>
              <h2 style={sectionTitleStyle}>Rôle & statut</h2>
            </div>

            <div style={gridStyle}>
              <Select name="role" label="Rôle" options={ROLE_OPTIONS} defaultValue="staff" />
              <Select name="language" label="Langue" options={['fr', 'en', 'ar']} />
              <Select name="status" label="Statut" options={['active', 'inactive']} />
              <Field name="department" label="Département" />
            </div>

            <p style={hintStyle}>
              Les permissions de base du rôle sélectionné sont appliquées automatiquement au moment de la création.
              Les cases ci-dessous ajoutent des accès supplémentaires.
            </p>
          </section>

          <SmartPermissionsPanel
            corePermissions={CORE_PERMISSIONS}
            pagePermissions={[...APP_ROUTE_PERMISSIONS]}
            defaultPermissions={['profile.view', 'staff_portal.view', 'page:/profile']}
          />
        </main>

        <aside style={sidePanelStyle}>
          <h3>Validation</h3>
          <ul>
            <li>Mot de passe ≥ 6 caractères</li>
            <li>Username unique</li>
            <li>Rôle standardisé AngelCare</li>
            <li>Permissions de base appliquées automatiquement</li>
            <li>Pages exactes visibles dans le panel</li>
          </ul>
          <button type="submit" style={buttonStyle}>Créer le compte</button>
        </aside>
      </form>
    </AppShell>
  )
}

function Field({ name, label, type = 'text' }: any) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      <input name={name} type={type} style={inputStyle} />
    </label>
  )
}

function Select({ name, label, options, defaultValue }: any) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} style={inputStyle}>
        {options.map((option: any) => {
          const value = typeof option === 'string' ? option : option.value
          const label = typeof option === 'string' ? option : option.label
          return <option key={value} value={value}>{label}</option>
        })}
      </select>
    </label>
  )
}

const pageGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 16, marginBottom: 18, border: '1px solid #e2e8f0', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const sectionHeaderStyle: React.CSSProperties = { marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { fontSize: 12, color: '#6366f1', fontWeight: 950, textTransform: 'uppercase', letterSpacing: .6 }
const sectionTitleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 950, color: '#0f172a', margin: '4px 0' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 4, color: '#0f172a', fontWeight: 850 }
const inputStyle: React.CSSProperties = { padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#0f172a' }
const hintStyle: React.CSSProperties = { margin: '14px 0 0', color: '#475569', fontWeight: 750, fontSize: 13, lineHeight: 1.6 }
const sidePanelStyle: React.CSSProperties = { position: 'sticky', top: 104, background: '#0f172a', color: '#fff', padding: 20, borderRadius: 16 }
const buttonStyle: React.CSSProperties = { marginTop: 20, width: '100%', padding: 12, background: '#fff', color: '#0f172a', borderRadius: 10, border: 'none', fontWeight: 950, cursor: 'pointer' }
