import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { APP_ROUTE_PERMISSIONS } from '@/lib/generated/app-routes'
import SmartPermissionsPanel from '@/app/(protected)/users/_components/SmartPermissionsPanel'

const CORE_PERMISSIONS = [
  { value: 'academy.view', label: 'Academy - Voir', module: 'academy' },
  { value: 'academy.manage', label: 'Academy - Gérer', module: 'academy' },
  { value: 'admin.view', label: 'Admin - Voir', module: 'admin' },
  { value: 'admin.manage', label: 'Admin - Gérer', module: 'admin' },
  { value: 'billing.view', label: 'Facturation - Voir', module: 'billing' },
  { value: 'billing.manage', label: 'Facturation - Gérer', module: 'billing' },
  { value: 'caregivers.view', label: 'Intervenantes - Voir', module: 'caregivers' },
  { value: 'caregivers.create', label: 'Intervenantes - Créer', module: 'caregivers' },
  { value: 'caregivers.edit', label: 'Intervenantes - Modifier', module: 'caregivers' },
  { value: 'caregivers.delete', label: 'Intervenantes - Supprimer', module: 'caregivers' },
  { value: 'contracts.view', label: 'Contrats - Voir', module: 'contracts' },
  { value: 'contracts.create', label: 'Contrats - Créer', module: 'contracts' },
  { value: 'contracts.edit', label: 'Contrats - Modifier', module: 'contracts' },
  { value: 'contracts.delete', label: 'Contrats - Supprimer', module: 'contracts' },
  { value: 'families.view', label: 'Familles - Voir', module: 'families' },
  { value: 'families.create', label: 'Familles - Créer', module: 'families' },
  { value: 'families.edit', label: 'Familles - Modifier', module: 'families' },
  { value: 'families.delete', label: 'Familles - Supprimer', module: 'families' },
  { value: 'hr.view', label: 'RH - Voir', module: 'hr' },
  { value: 'hr.manage', label: 'RH - Gérer', module: 'hr' },
  { value: 'incidents.view', label: 'Incidents - Voir', module: 'incidents' },
  { value: 'incidents.create', label: 'Incidents - Créer', module: 'incidents' },
  { value: 'incidents.edit', label: 'Incidents - Modifier', module: 'incidents' },
  { value: 'incidents.close', label: 'Incidents - Clôturer', module: 'incidents' },
  { value: 'leads.view', label: 'Leads - Voir', module: 'leads' },
  { value: 'leads.create', label: 'Leads - Créer', module: 'leads' },
  { value: 'leads.edit', label: 'Leads - Modifier', module: 'leads' },
  { value: 'leads.delete', label: 'Leads - Supprimer', module: 'leads' },
  { value: 'locations.view', label: 'Localisations - Voir', module: 'locations' },
  { value: 'locations.manage', label: 'Localisations - Gérer', module: 'locations' },
  { value: 'missions.view', label: 'Missions - Voir', module: 'missions' },
  { value: 'missions.create', label: 'Missions - Créer', module: 'missions' },
  { value: 'missions.edit', label: 'Missions - Modifier', module: 'missions' },
  { value: 'missions.assign', label: 'Missions - Assigner', module: 'missions' },
  { value: 'missions.delete', label: 'Missions - Supprimer', module: 'missions' },
  { value: 'operations.view', label: 'Operations - Voir', module: 'operations' },
  { value: 'operations.manage', label: 'Operations - Gérer', module: 'operations' },
  { value: 'pointage.view', label: 'Pointage - Voir', module: 'pointage' },
  { value: 'pointage.manage', label: 'Pointage - Gérer', module: 'pointage' },
  { value: 'print.view', label: 'Print Center - Voir', module: 'print' },
  { value: 'print.create', label: 'Print Center - Créer', module: 'print' },
  { value: 'reports.view', label: 'Rapports - Voir', module: 'reports' },
  { value: 'reports.export', label: 'Rapports - Exporter', module: 'reports' },
  { value: 'revenue.view', label: 'Revenue Center - Voir', module: 'revenue-command-center' },
  { value: 'revenue.manage', label: 'Revenue Center - Gérer', module: 'revenue-command-center' },
  { value: 'sales.view', label: 'Sales - Voir', module: 'sales' },
  { value: 'sales.manage', label: 'Sales - Gérer', module: 'sales' },
  { value: 'services.view', label: 'Services - Voir', module: 'services' },
  { value: 'services.create', label: 'Services - Créer', module: 'services' },
  { value: 'services.edit', label: 'Services - Modifier', module: 'services' },
  { value: 'services.delete', label: 'Services - Supprimer', module: 'services' },
  { value: 'users.view', label: 'Utilisateurs - Voir', module: 'users' },
  { value: 'users.create', label: 'Utilisateurs - Créer', module: 'users' },
  { value: 'users.edit', label: 'Utilisateurs - Modifier', module: 'users' },
  { value: 'users.delete', label: 'Utilisateurs - Supprimer', module: 'users' },
  { value: 'voice.view', label: 'Voice Center - Voir', module: 'voice-center' },
  { value: 'voice.call', label: 'Voice Center - Appeler', module: 'voice-center' },
  { value: 'voice.manage', label: 'Voice Center - Gérer', module: 'voice-center' },
]

export default async function NewUserPage() {
  await requireRole(['ceo', 'manager'])

  async function createUser(formData: FormData) {
    'use server'

    const actor = await requireRole(['ceo', 'manager'])
    const supabase = await createClient()

    const password = String(formData.get('password') || '')
    if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.')

    const permissions = Array.from(new Set(formData.getAll('permissions').map(String)))

    const { data: passwordHash, error: hashError } = await supabase.rpc('hash_app_password', {
      input_password: password,
    })

    if (hashError) throw new Error(hashError.message)
    if (!passwordHash) throw new Error('Erreur génération mot de passe.')

    const payload = {
      full_name: String(formData.get('full_name') || ''),
      username: String(formData.get('username') || '').trim().toLowerCase(),
      password_hash: passwordHash,
      role: String(formData.get('role') || 'agent'),
      status: String(formData.get('status') || 'active'),
      language: String(formData.get('language') || 'fr'),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || ''),
      department: String(formData.get('department') || ''),
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
        details: { username: payload.username, role: payload.role, permissions_count: permissions.length },
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
              <Select name="role" label="Rôle" options={['ceo', 'manager', 'agent']} />
              <Select name="language" label="Langue" options={['fr', 'en', 'ar']} />
              <Select name="status" label="Statut" options={['active', 'inactive']} />
              <Field name="department" label="Département" />
            </div>
          </section>

          <SmartPermissionsPanel
            corePermissions={CORE_PERMISSIONS}
            pagePermissions={[...APP_ROUTE_PERMISSIONS]}
            defaultPermissions={['profile.view', 'page:/profile']}
          />
        </main>

        <aside style={sidePanelStyle}>
          <h3>Validation</h3>
          <ul>
            <li>Mot de passe ≥ 6 caractères</li>
            <li>Username unique</li>
            <li>Permissions métier adaptées</li>
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

function Select({ name, label, options }: any) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      <select name={name} style={inputStyle}>
        {options.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
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
const sidePanelStyle: React.CSSProperties = { position: 'sticky', top: 104, background: '#0f172a', color: '#fff', padding: 20, borderRadius: 16 }
const buttonStyle: React.CSSProperties = { marginTop: 20, width: '100%', padding: 12, background: '#fff', color: '#0f172a', borderRadius: 10, border: 'none', fontWeight: 950, cursor: 'pointer' }
