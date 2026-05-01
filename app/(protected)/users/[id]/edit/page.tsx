import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { MODULE_PERMISSIONS } from '@/lib/auth/permissions'
import { APP_ROUTE_PERMISSIONS } from '@/lib/generated/app-routes'
import SmartPermissionsPanel from '@/app/(protected)/users/_components/SmartPermissionsPanel'

const CORE_PERMISSIONS = Object.entries(MODULE_PERMISSIONS).flatMap(([moduleKey, permissions]) =>
  permissions.map((permission) => ({
    value: permission,
    label: permission,
    module: moduleKey,
  }))
)

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager'])

  const { id } = await params
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !user) notFound()

  async function updateUser(formData: FormData) {
    'use server'

    await requireRole(['ceo', 'manager'])
    const supabase = await createClient()

    const permissions = Array.from(new Set(formData.getAll('permissions').map(String)))

    const payload = {
      full_name: String(formData.get('full_name') || ''),
      username: String(formData.get('username') || '').trim().toLowerCase(),
      role: String(formData.get('role') || 'agent'),
      status: String(formData.get('status') || 'active'),
      language: String(formData.get('language') || 'fr'),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || ''),
      department: String(formData.get('department') || ''),
      job_title: String(formData.get('job_title') || ''),
      permissions,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('id', id)

    if (error) throw new Error(error.message)

    await supabase.from('app_audit_logs').insert([
      {
        actor_user_id: null,
        action: 'update_user_permissions',
        target_table: 'app_users',
        target_id: id,
        details: { username: payload.username, role: payload.role, permissions_count: permissions.length },
      },
    ])

    redirect(`/users/${id}`)
  }

  const permissions: string[] = Array.isArray(user.permissions) ? user.permissions : []

  return (
    <AppShell
      title={`Modifier ${user.full_name}`}
      subtitle="Gestion du rôle, statut, permissions métier et pages visibles."
      breadcrumbs={[
        { label: 'Administration', href: '/users' },
        { label: user.full_name, href: `/users/${user.id}` },
        { label: 'Modifier' },
      ]}
      actions={<PageAction href={`/users/${user.id}`} variant="light">Retour profil</PageAction>}
    >
      <form action={updateUser} style={pageStyle}>
        <main>
          <section style={panelStyle}>
            <h2 style={titleStyle}>Identité</h2>
            <div style={gridStyle}>
              <Field name="full_name" label="Nom complet" defaultValue={user.full_name} />
              <Field name="username" label="Nom utilisateur" defaultValue={user.username} />
              <Field name="phone" label="Téléphone" defaultValue={user.phone} />
              <Field name="email" label="Email" defaultValue={user.email} />
              <Field name="department" label="Département" defaultValue={user.department} />
              <Field name="job_title" label="Poste" defaultValue={user.job_title} />
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={titleStyle}>Accès</h2>
            <div style={gridStyle}>
              <Select name="role" label="Rôle" options={['ceo', 'manager', 'ops_admin', 'sales', 'coordinator', 'caregiver', 'viewer', 'agent']} defaultValue={user.role} />
              <Select name="status" label="Statut" options={['active', 'inactive']} defaultValue={user.status} />
              <Select name="language" label="Langue" options={['fr', 'en', 'ar']} defaultValue={user.language} />
            </div>
          </section>

          <SmartPermissionsPanel
            corePermissions={CORE_PERMISSIONS}
            pagePermissions={[...APP_ROUTE_PERMISSIONS]}
            defaultPermissions={permissions}
          />
        </main>

        <aside style={sidePanelStyle}>
          <div style={badgeStyle}>User Manager</div>
          <h3 style={{ marginTop: 0 }}>Contrôle utilisateur</h3>
          <p style={{ color: '#dbeafe', lineHeight: 1.6 }}>
            Toute modification impacte les accès opérationnels et les pages visibles dans le panel.
          </p>
          <button type="submit" style={buttonStyle}>Enregistrer modifications</button>
        </aside>
      </form>
    </AppShell>
  )
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input name={name} defaultValue={defaultValue || ''} style={inputStyle} />
    </label>
  )
}

function Select({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <select name={name} defaultValue={defaultValue} style={inputStyle}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', marginBottom: 18 }
const titleStyle: React.CSSProperties = { margin: '0 0 18px', color: '#0f172a', fontSize: 22, fontWeight: 950 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const labelStyle: React.CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box', background: '#fff' }
const sidePanelStyle: React.CSSProperties = { position: 'sticky', top: 104, background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)', borderRadius: 24, padding: 22, color: '#fff', boxShadow: '0 24px 50px rgba(15,23,42,.22)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 14 }
const buttonStyle: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, background: '#fff', color: '#0f172a', padding: '14px 16px', fontWeight: 950, cursor: 'pointer', marginTop: 18 }
