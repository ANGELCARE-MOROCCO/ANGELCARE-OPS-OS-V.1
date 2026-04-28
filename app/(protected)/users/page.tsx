import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export default async function UsersPage() {
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()
  const { data } = await supabase.from('app_users').select('*').order('created_at', { ascending: false })
  const users = data || []
  const active = users.filter((u: any) => u.status === 'active').length
  const managers = users.filter((u: any) => ['ceo', 'manager'].includes(u.role)).length

  return (
    <AppShell title="User Management" subtitle="Création, contrôle et gouvernance des comptes utilisateurs AngelCare." breadcrumbs={[{ label: 'Administration' }, { label: 'Users' }]} actions={<PageAction href="/users/new">+ Nouvel utilisateur</PageAction>}>
      <section style={metricGridStyle}>
        <MetricCard label="Utilisateurs" value={users.length} sub="comptes système" icon="👥" />
        <MetricCard label="Actifs" value={active} sub="peuvent se connecter" icon="✅" accent="#166534" />
        <MetricCard label="Managers" value={managers} sub="CEO / Manager" icon="👑" accent="#7c3aed" />
        <MetricCard label="Sécurité" value="Active" sub="username + password" icon="🔐" accent="#1d4ed8" />
      </section>

      <ERPPanel title="Comptes utilisateurs" subtitle="Chaque utilisateur doit être créé par CEO ou Manager avec rôle, langue et statut.">
        <div style={gridStyle}>
          {users.map((user: any) => (
            <article key={user.id} style={cardStyle}>
              <div style={topStyle}>
                <div>
                  <h3 style={nameStyle}>{user.full_name}</h3>
                  <p style={metaStyle}>@{user.username}</p>
                </div>
                <StatusPill tone={user.status === 'active' ? 'green' : 'red'}>{user.status}</StatusPill>
              </div>
              <div style={infoGridStyle}>
                <Mini label="Rôle" value={user.role} />
                <Mini label="Langue" value={user.language || 'fr'} />
                <Mini label="Département" value={user.department || '—'} />
              </div>
              <div style={footerStyle}>
                <Link href={`/users/${user.id}`} style={buttonLightStyle}>Profil</Link>
                <span style={dateStyle}>{user.last_login_at ? 'Déjà connecté' : 'Jamais connecté'}</span>
              </div>
            </article>
          ))}
        </div>
      </ERPPanel>
    </AppShell>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div style={miniStyle}><span style={miniLabelStyle}>{label}</span><strong style={miniValueStyle}>{value}</strong></div>
}

const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const cardStyle: React.CSSProperties = { padding: 18, borderRadius: 22, border: '1px solid #dbe3ee', background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)', boxShadow: '0 16px 34px rgba(15,23,42,.06)' }
const topStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }
const nameStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontWeight: 950, fontSize: 18 }
const metaStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750 }
const infoGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 14 }
const miniStyle: React.CSSProperties = { padding: 10, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0' }
const miniLabelStyle: React.CSSProperties = { display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 950, marginBottom: 4 }
const miniValueStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 950, fontSize: 13 }
const footerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }
const buttonLightStyle: React.CSSProperties = { textDecoration: 'none', padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 900 }
const dateStyle: React.CSSProperties = { color: '#94a3b8', fontSize: 12, fontWeight: 850 }
