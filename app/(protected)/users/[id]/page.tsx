import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(['ceo', 'manager'])

  const { id } = await params
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !user) notFound()

  const { data: sessions } = await supabase
    .from('app_sessions')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: logs } = await supabase
    .from('app_audit_logs')
    .select('*')
    .eq('actor_user_id', id)
    .order('created_at', { ascending: false })
    .limit(8)

  const permissions: string[] = user.permissions || []
  const activeSessions = sessions?.filter((s) => new Date(s.expires_at) > new Date()).length || 0

  return (
    <AppShell
      title={user.full_name || 'Profil utilisateur'}
      subtitle={`Compte interne AngelCare • ${user.role} • ${user.status}`}
      breadcrumbs={[
        { label: 'Administration', href: '/users' },
        { label: user.full_name || 'Profil utilisateur' },
      ]}
      actions={
        <>
          <PageAction href="/users" variant="light">Retour</PageAction>
          <PageAction href={`/users/${user.id}/edit`}>Modifier</PageAction>
          <PageAction href={`/users/${user.id}/delete`} variant="light">Supprimer</PageAction>
          <PageAction href={`/users/${user.id}/attendance`} variant="light">Attendance</PageAction>
          <PageAction href={`/users/${user.id}/attendance`} variant="light">Attendance Dashboard</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={avatarStyle}>{initials(user.full_name)}</div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={badgeRowStyle}>
              <span style={statusBadge(user.status)}>{user.status}</span>
              <span style={roleBadgeStyle}>{user.role}</span>
              <span style={softBadgeStyle}>{user.language || 'fr'}</span>
            </div>

            <h1 style={heroTitleStyle}>{user.full_name || 'Utilisateur sans nom'}</h1>
            <p style={heroTextStyle}>
              {user.job_title || 'Poste non renseigné'} • {user.department || 'Département non défini'}
            </p>

            <div style={heroMetaStyle}>
              <Metric label="Sessions actives" value={String(activeSessions)} />
              <Metric label="Permissions" value={String(permissions.length)} />
              <Metric label="Dernière connexion" value={formatDate(user.last_login_at)} />
              <Metric label="Créé le" value={formatDate(user.created_at)} />
            </div>
          </div>
        </section>

        <div style={gridStyle}>
          <section style={panelStyle}>
            <Header eyebrow="Identité" title="Informations personnelles" />
            <Info label="Nom complet" value={user.full_name} />
            <Info label="Nom utilisateur" value={user.username} />
            <Info label="Téléphone" value={user.phone} />
            <Info label="Email" value={user.email} />
            <Info label="Langue" value={user.language} />
          </section>

          <section style={panelStyle}>
            <Header eyebrow="Professionnel" title="Profil opérationnel" />
            <Info label="Département" value={user.department} />
            <Info label="Poste" value={user.job_title} />
            <Info label="Rôle système" value={user.role} />
            <Info label="Statut" value={user.status} />
            <Info label="Changement mot de passe" value={user.must_change_password ? 'Obligatoire' : 'Non requis'} />
          </section>

          <section style={widePanelStyle}>
            <Header eyebrow="Permissions" title="Modules autorisés" />
            {permissions.length ? (
              <div style={permissionGridStyle}>
                {permissions.map((permission) => (
                  <div key={permission} style={permissionStyle}>
                    <strong>{permissionLabel(permission)}</strong>
                    <span>{permission}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Aucune permission détaillée définie pour cet utilisateur." />
            )}
          </section>

          <section style={panelStyle}>
            <Header eyebrow="Connexions" title="Sessions récentes" />
            {sessions?.length ? (
              <div style={listStyle}>
                {sessions.map((session) => (
                  <div key={session.id} style={logItemStyle}>
                    <strong>{new Date(session.expires_at) > new Date() ? 'Session active' : 'Session expirée'}</strong>
                    <span>Créée: {formatDate(session.created_at)}</span>
                    <small>Expire: {formatDate(session.expires_at)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Aucune session enregistrée." />
            )}
          </section>

          <section style={panelStyle}>
            <Header eyebrow="Activité" title="Journal utilisateur" />
            {logs?.length ? (
              <div style={listStyle}>
                {logs.map((log) => (
                  <div key={log.id} style={logItemStyle}>
                    <strong>{log.action}</strong>
                    <span>{log.target_table || 'Système'}</span>
                    <small>{formatDate(log.created_at)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Aucune activité récente." />
            )}
          </section>

          <section style={widePanelStyle}>
            <Header eyebrow="Management" title="Lecture manager rapide" />
            <div style={managerGridStyle}>
              <ManagerCard title="Niveau d’accès" value={user.role === 'ceo' ? 'Contrôle total' : permissions.length > 5 ? 'Accès étendu' : 'Accès limité'} />
              <ManagerCard title="Risque opérationnel" value={user.status !== 'active' ? 'Compte désactivé' : user.must_change_password ? 'Mot de passe temporaire' : 'Normal'} />
              <ManagerCard title="Action recommandée" value={permissions.length === 0 && user.role !== 'ceo' ? 'Ajouter permissions' : 'Surveillance standard'} />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={eyebrowStyle}>{eyebrow}</div>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={infoRowStyle}>
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ManagerCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={managerCardStyle}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

function initials(name?: string | null) {
  if (!name) return 'AC'
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function permissionLabel(permission: string) {
  const labels: Record<string, string> = {
    'leads.view': 'Voir les leads',
    'leads.create': 'Créer des leads',
    'families.view': 'Voir familles',
    'caregivers.view': 'Voir intervenantes',
    'missions.view': 'Voir missions',
    'missions.assign': 'Assigner missions',
    'billing.view': 'Voir facturation',
    'reports.view': 'Voir rapports',
    'users.manage': 'Gérer utilisateurs',
    'voice_center.access': 'Voice Center',
    'revenue_center.access': 'Revenue Center',
  }

  return labels[permission] || permission
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', gap: 22, alignItems: 'center', background: 'linear-gradient(135deg,#0f172a,#1d4ed8)', borderRadius: 30, padding: 28, color: '#fff', boxShadow: '0 28px 70px rgba(15,23,42,.24)' }
const avatarStyle: React.CSSProperties = { width: 92, height: 92, borderRadius: 28, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 950, border: '1px solid rgba(255,255,255,.25)' }
const badgeRowStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }
const roleBadgeStyle: React.CSSProperties = { padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontWeight: 900, fontSize: 12 }
const softBadgeStyle: React.CSSProperties = { padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.10)', fontWeight: 900, fontSize: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 36, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '8px 0 20px', color: '#dbeafe', fontWeight: 750 }
const heroMetaStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const metricStyle: React.CSSProperties = { background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 18, padding: 14, display: 'grid', gap: 4 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const widePanelStyle: React.CSSProperties = { ...panelStyle, gridColumn: '1 / -1' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 12, marginBottom: 8 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const infoRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, padding: '13px 0', borderBottom: '1px solid #e2e8f0', color: '#334155' }
const permissionGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const permissionStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 15, borderRadius: 16, border: '1px solid #dbe3ee', background: '#f8fafc', color: '#0f172a' }
const listStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const logItemStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const managerGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const managerCardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 18, borderRadius: 20, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', color: '#0f172a' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }

function statusBadge(status: string): React.CSSProperties {
  return {
    padding: '7px 11px',
    borderRadius: 999,
    background: status === 'active' ? '#dcfce7' : '#fee2e2',
    color: status === 'active' ? '#166534' : '#991b1b',
    fontWeight: 950,
    fontSize: 12,
  }
}