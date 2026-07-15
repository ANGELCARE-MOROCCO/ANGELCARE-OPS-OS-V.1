import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type Log = {
  id: string
  action: string
  note: string | null
  created_at: string
}

const ACTIONS: Record<string, { label: string; icon: string; tone: string }> = {
  shift_in: { label: 'Punch IN', icon: '🟢', tone: '#22c55e' },
  shift_out: { label: 'Punch OUT', icon: '🔴', tone: '#ef4444' },
  lunch_start: { label: 'Pause déjeuner', icon: '🍽️', tone: '#f59e0b' },
  lunch_end: { label: 'Retour poste', icon: '⚡', tone: '#3b82f6' },
}

export default async function UserAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ from?: string; to?: string; action?: string }>
}) {
  await requireRole(['ceo', 'manager'])

  const { id } = await params
  const filters = await searchParams

  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)

  const from = filters?.from || sevenDaysAgo.toISOString().slice(0, 10)
  const to = filters?.to || today.toISOString().slice(0, 10)
  const action = filters?.action || 'all'

  const supabase = await createClient()

  const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!user) notFound()

  let query = supabase
    .from('app_attendance_logs')
    .select('*')
    .eq('user_id', id)
    .gte('created_at', `${from}T00:00:00.000Z`)
    .lte('created_at', `${to}T23:59:59.999Z`)
    .order('created_at', { ascending: false })

  if (action !== 'all') query = query.eq('action', action)

  const { data } = await query
  const logs = (data || []) as Log[]

  const latest = logs[0]
  const current = latest ? ACTIONS[latest.action] : null

  const inCount = logs.filter((l) => l.action === 'shift_in').length
  const outCount = logs.filter((l) => l.action === 'shift_out').length
  const lunchCount = logs.filter((l) => l.action === 'lunch_start').length
  const backCount = logs.filter((l) => l.action === 'lunch_end').length
  const consistency = inCount === outCount ? 'Cohérent' : 'À vérifier'

  return (
    <AppShell
      title="Attendance Command Center"
      subtitle={`Contrôle RH premium • ${user.full_name}`}
      breadcrumbs={[
        { label: 'Utilisateurs', href: '/users' },
        { label: user.full_name, href: `/users/${user.id}` },
        { label: 'Attendance' },
      ]}
      actions={
        <>
          <PageAction href={`/users/${user.id}`} variant="light">Retour profil</PageAction>
          <PageAction href={`/users/${user.id}/edit`} variant="light">Modifier user</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroV2Style}>
          <div style={heroGlowStyle} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={badgeStyle}>⚡ HR COMMAND CENTER</div>

            <h1 style={heroV2Title}>{user.full_name}</h1>

            <p style={heroV2Subtitle}>
              {user.job_title || 'Poste non défini'} • {user.department || 'Direction Générale'}
            </p>

            <div style={metaRowStyle}>
              <span>🆔 {user.username}</span>
              <span>🌍 {user.language || 'fr'}</span>
              <span>📊 Suivi temps réel</span>
            </div>
          </div>

          <div style={statusPanelStyle(current?.tone || '#64748b')}>
            <div style={statusLiveStyle}>● LIVE</div>

            <div style={statusTopStyle}>
              <span style={{ fontSize: 46 }}>{current?.icon || '⚪'}</span>

              <div>
                <div style={statusLabelStyle}>STATUT ACTUEL</div>
                <div style={statusValueStyle}>{current?.label || 'NON POINTÉ'}</div>
              </div>
            </div>

            <div style={statusDivider} />

            <div style={statusMetaStyle}>
              <div>
                <small>Dernière activité</small>
                <strong>{latest ? formatDate(latest.created_at) : 'Aucune'}</strong>
              </div>

              <div>
                <small>État RH</small>
                <strong>{logs.length ? 'Actif' : 'Inactif'}</strong>
              </div>
            </div>
          </div>
        </section>

        <form style={filterPanelStyle}>
          <div style={filterTitleStyle}>Filtres manager</div>

          <label style={fieldStyle}>
            <span>Du</span>
            <input type="date" name="from" defaultValue={from} style={inputStyle} />
          </label>

          <label style={fieldStyle}>
            <span>Au</span>
            <input type="date" name="to" defaultValue={to} style={inputStyle} />
          </label>

          <label style={fieldStyle}>
            <span>Action</span>
            <select name="action" defaultValue={action} style={inputStyle}>
              <option value="all">Toutes actions</option>
              <option value="shift_in">Punch IN</option>
              <option value="shift_out">Punch OUT</option>
              <option value="lunch_start">Pause déjeuner</option>
              <option value="lunch_end">Retour poste</option>
            </select>
          </label>

          <button style={filterButtonStyle}>Appliquer</button>
        </form>

        <section style={kpiGridStyle}>
          <Kpi title="Total actions" value={String(logs.length)} sub="sur période filtrée" />
          <Kpi title="Punch IN" value={String(inCount)} sub="démarrages shift" />
          <Kpi title="Punch OUT" value={String(outCount)} sub="fins shift" />
          <Kpi title="Pauses" value={String(lunchCount)} sub="déjeuners déclarés" />
          <Kpi title="Retours poste" value={String(backCount)} sub="retours confirmés" />
          <Kpi title="Cohérence" value={consistency} sub="lecture manager" />
        </section>

        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="Timeline opérationnelle" subtitle="Lecture chronologique des actions RH." />

            {logs.length ? (
              <div style={timelineStyle}>
                {logs.map((log) => {
                  const meta = ACTIONS[log.action] || { label: log.action, icon: '•', tone: '#64748b' }

                  return (
                    <div key={log.id} style={timelineItemStyle(meta.tone)}>
                      <div style={bubbleStyle(meta.tone)}>{meta.icon}</div>
                      <div>
                        <strong>{meta.label}</strong>
                        <p>{formatDate(log.created_at)}</p>
                        {log.note ? <small>{log.note}</small> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty text="Aucune donnée de pointage trouvée pour ces filtres." />
            )}
          </div>

          <aside style={sidePanelStyle}>
            <Header title="Diagnostic CEO / Manager" subtitle="Lecture rapide des signaux RH." />

            <Insight label="Statut actuel" value={current?.label || 'Non pointé'} />
            <Insight label="Équilibre IN / OUT" value={consistency} />
            <Insight label="Adoption outil" value={logs.length > 0 ? 'Utilisateur actif' : 'Aucune adoption'} />
            <Insight label="Action recommandée" value={logs.length === 0 ? 'Former utilisateur' : 'Suivi standard'} />

            <div style={alertBoxStyle}>
              <strong>Smart Note</strong>
              <p>Les données affichées proviennent des pointages enregistrés depuis le widget HR.</p>
            </div>
          </aside>
        </section>

        <section style={panelStyle}>
          <Header title="Table de contrôle détaillée" subtitle="Logs bruts filtrés, utiles pour audit RH." />

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Heure</th>
                  <th style={thStyle}>Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const d = new Date(log.created_at)
                  const meta = ACTIONS[log.action] || { label: log.action, icon: '•', tone: '#64748b' }

                  return (
                    <tr key={log.id}>
                      <td style={tdStyle}><strong>{meta.icon} {meta.label}</strong></td>
                      <td style={tdStyle}>{d.toLocaleDateString('fr-FR')}</td>
                      <td style={tdStyle}>{d.toLocaleTimeString('fr-FR', { hour12: false })}</td>
                      <td style={tdStyle}>{log.note || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div style={kpiStyle}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionTextStyle}>{subtitle}</p>
    </div>
  )
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div style={insightStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(date))
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroV2Style: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  padding: 34,
  borderRadius: 36,
  background: 'linear-gradient(135deg,#1e3a8a,#020617 62%)',
  color: '#fff',
  boxShadow: '0 35px 90px rgba(2,6,23,.45)',
  border: '1px solid rgba(255,255,255,.08)',
  position: 'relative',
  overflow: 'hidden',
}
const heroGlowStyle: React.CSSProperties = {
  position: 'absolute',
  width: 340,
  height: 340,
  background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 62%)',
  top: -110,
  left: -90,
  filter: 'blur(40px)',
}
const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 'fit-content',
  padding: '7px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.14)',
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1,
  color: '#dbeafe',
}
const heroV2Title: React.CSSProperties = {
  margin: 0,
  fontSize: 48,
  fontWeight: 1000,
  letterSpacing: -0.8,
  color: '#ffffff',
  textTransform: 'uppercase',
  textShadow: '0 3px 18px rgba(255,255,255,0.22)',
}
const heroV2Subtitle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 800,
}
const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginTop: 8,
  fontSize: 13,
  color: 'rgba(255,255,255,0.96)',
  fontWeight: 850,
  flexWrap: 'wrap',
}
const statusPanelStyle = (color: string): React.CSSProperties => ({
  position: 'relative',
  zIndex: 1,
  minWidth: 340,
  padding: 22,
  borderRadius: 30,
  background: 'rgba(255,255,255,.08)',
  border: `1px solid ${color}`,
  backdropFilter: 'blur(10px)',
  boxShadow: `0 0 44px ${color}33`,
})
const statusLiveStyle: React.CSSProperties = {
  display: 'inline-flex',
  marginBottom: 10,
  color: '#22c55e',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 1,
}
const statusTopStyle: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center' }
const statusLabelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: 1, color: '#cbd5e1', fontWeight: 950 }
const statusValueStyle: React.CSSProperties = { fontSize: 23, fontWeight: 1000, color: '#fff', letterSpacing: 0.5 }
const statusDivider: React.CSSProperties = { height: 1, background: 'rgba(255,255,255,.12)', margin: '14px 0' }
const statusMetaStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, color: '#dbeafe' }
const filterPanelStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 180px 180px 220px auto', gap: 14, alignItems: 'end', padding: 18, borderRadius: 24, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const filterTitleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 950, color: '#0f172a' }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc' }
const filterButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.35fr .65fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sidePanelStyle: React.CSSProperties = { ...panelStyle, position: 'sticky', top: 90 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const timelineStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const timelineItemStyle = (color: string): React.CSSProperties => ({ display: 'flex', gap: 13, padding: 14, borderRadius: 18, background: `${color}10`, border: `1px solid ${color}44`, color: '#0f172a' })
const bubbleStyle = (color: string): React.CSSProperties => ({ width: 44, height: 44, borderRadius: 16, display: 'grid', placeItems: 'center', background: `${color}22`, border: `1px solid ${color}55` })
const insightStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 15, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', marginBottom: 10, color: '#0f172a' }
const alertBoxStyle: React.CSSProperties = { marginTop: 16, padding: 16, borderRadius: 20, background: '#0f172a', color: '#fff' }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: '#fff' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 14, background: '#0f172a', color: '#fff' }
const tdStyle: React.CSSProperties = { padding: 14, borderBottom: '1px solid #e2e8f0', color: '#334155' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }