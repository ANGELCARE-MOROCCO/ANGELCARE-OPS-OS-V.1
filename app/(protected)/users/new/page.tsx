import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

const PERMISSIONS = [
  { value: 'leads.view', label: 'Voir les leads' },
  { value: 'leads.create', label: 'Créer des leads' },
  { value: 'families.view', label: 'Voir familles' },
  { value: 'caregivers.view', label: 'Voir intervenantes' },
  { value: 'missions.view', label: 'Voir missions' },
  { value: 'missions.assign', label: 'Assigner missions' },
  { value: 'billing.view', label: 'Voir facturation' },
  { value: 'reports.view', label: 'Voir rapports' },
  { value: 'users.manage', label: 'Gérer utilisateurs' },
  { value: 'voice_center.access', label: 'Voice Center' },
  { value: 'revenue_center.access', label: 'Revenue Center' },
]

export default async function NewUserPage() {
  await requireRole(['ceo', 'manager'])

  async function createUser(formData: FormData) {
    'use server'

    const actor = await requireRole(['ceo', 'manager'])
    const supabase = await createClient()

    const password = String(formData.get('password') || '')
    if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.')

    const permissions = formData.getAll('permissions').map(String)

    // 🔐 Hash password via Postgres
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
        details: { username: payload.username, role: payload.role },
      },
    ])

    redirect('/users')
  }

  return (
    <AppShell
      title="Créer utilisateur"
      subtitle="Création d’un compte interne avec nom utilisateur, mot de passe, rôle et permissions."
      breadcrumbs={[{ label: 'Administration', href: '/users' }, { label: 'Nouvel utilisateur' }]}
      actions={<PageAction href="/users" variant="light">Retour</PageAction>}
    >
      <form action={createUser} style={pageGridStyle}>
        {/* IDENTITÉ */}
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

        {/* ACCÈS */}
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

        {/* PERMISSIONS */}
        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div style={eyebrowStyle}>Permissions</div>
            <h2 style={sectionTitleStyle}>Accès détaillés</h2>
          </div>

          <div style={permissionsGridStyle}>
            {PERMISSIONS.map((perm) => (
              <label key={perm.value} style={permissionCardStyle}>
                <input type="checkbox" name="permissions" value={perm.value} />
                <span>
                  <strong>{perm.label}</strong>
                  <br />
                  <small>{perm.value}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* SIDE PANEL */}
        <aside style={sidePanelStyle}>
          <h3>Validation</h3>
          <ul>
            <li>Mot de passe ≥ 6 caractères</li>
            <li>Username unique</li>
            <li>Permissions adaptées</li>
          </ul>
          <button type="submit" style={buttonStyle}>Créer le compte</button>
        </aside>
      </form>
    </AppShell>
  )
}

/* COMPONENTS */
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
        {options.map((o: string) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

/* STYLES */
const pageGridStyle = { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }
const panelStyle = { background: '#fff', padding: 20, borderRadius: 16 }
const sectionHeaderStyle = { marginBottom: 10 }
const eyebrowStyle = { fontSize: 12, color: '#6366f1' }
const sectionTitleStyle = { fontSize: 20, fontWeight: 900 }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }
const fieldStyle = { display: 'grid', gap: 4 }
const inputStyle = { padding: 10, border: '1px solid #ccc', borderRadius: 8 }
const permissionsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }
const permissionCardStyle = { display: 'flex', gap: 10, padding: 10, border: '1px solid #ddd', borderRadius: 10 }
const sidePanelStyle = { background: '#0f172a', color: '#fff', padding: 20, borderRadius: 16 }
const buttonStyle = { marginTop: 20, width: '100%', padding: 12, background: '#fff', borderRadius: 10 }