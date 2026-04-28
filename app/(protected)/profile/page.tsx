import AppShell from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard } from '@/app/components/erp/ERPPrimitives'
import { requireUser } from '@/lib/auth/session'


export default async function ProfilePage() {
  const user = await requireUser()

  return (
    <AppShell title="Mon profil" subtitle="Zone profil premium : rôle, langue, statut, sécurité et accès." breadcrumbs={[{ label: 'Profil' }]}>
      <section style={metricGridStyle}>
        <MetricCard label="Utilisateur" value={user.full_name} sub={`@${user.username}`} icon="👤" />
        <MetricCard label="Rôle" value={user.role} sub="accès système" icon="🛡️" accent="#7c3aed" />
        <MetricCard label="Langue" value={user.language || 'fr'} sub="préférence système" icon="🌍" accent="#1d4ed8" />
        <MetricCard label="Statut" value={user.status} sub="compte utilisateur" icon="✅" accent="#166534" />
      </section>

      <ERPPanel title="Profil utilisateur" subtitle="Informations internes du compte connecté.">
        <div style={profileGridStyle}>
          <Info label="Nom complet" value={user.full_name} />
          <Info label="Nom utilisateur" value={user.username} />
          <Info label="Email" value={user.email || '—'} />
          <Info label="Téléphone" value={user.phone || '—'} />
          <Info label="Département" value={user.department || '—'} />
          <Info label="Poste" value={user.job_title || '—'} />
          <Info label="Dernière connexion" value={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Jamais'} />
          <Info label="Mot de passe" value={user.must_change_password ? 'À changer' : 'OK'} />
        </div>
<div style={{ marginTop: 18 }}>
  <a href="/logout" style={logoutButtonStyle}>
    Se déconnecter
  </a>
</div>
      </ERPPanel>
    </AppShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div style={infoStyle}><span style={infoLabelStyle}>{label}</span><strong style={infoValueStyle}>{value}</strong></div>
}

const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const profileGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const infoStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' }
const infoLabelStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontSize: 12, fontWeight: 950, marginBottom: 6 }
const infoValueStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 950, fontSize: 14 }
const logoutButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, background: '#991b1b', color: '#fff', padding: '12px 16px', fontWeight: 950, cursor: 'pointer' }
