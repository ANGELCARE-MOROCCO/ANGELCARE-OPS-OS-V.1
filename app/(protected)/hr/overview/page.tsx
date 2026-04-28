import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type AppUser = {
  id: string
  full_name: string | null
  username: string | null
  role: string | null
  status: string | null
  department: string | null
  job_title: string | null
  language: string | null
  last_login_at: string | null
  created_at: string | null
}

type AttendanceLog = {
  id: string
  user_id: string
  action: string
  note: string | null
  created_at: string
}

type StaffStatus = {
  user: AppUser
  latest?: AttendanceLog
  todayLogs: AttendanceLog[]
  statusKey: StatusKey
  statusLabel: string
  statusIcon: string
  tone: string
  riskLabel: string
  riskTone: string
  managerNote: string
  firstIn?: AttendanceLog
  lastOut?: AttendanceLog
}

type StatusKey = 'working' | 'out' | 'lunch' | 'back' | 'no_activity'

const ACTIONS: Record<string, { label: string; icon: string; tone: string; statusKey: StatusKey }> = {
  shift_in: { label: 'En service', icon: '🟢', tone: '#22c55e', statusKey: 'working' },
  shift_out: { label: 'Shift terminé', icon: '🔴', tone: '#ef4444', statusKey: 'out' },
  lunch_start: { label: 'Pause déjeuner', icon: '🍽️', tone: '#f59e0b', statusKey: 'lunch' },
  lunch_end: { label: 'Retour au poste', icon: '⚡', tone: '#3b82f6', statusKey: 'back' },
}

const DEFAULT_STATUS = {
  label: 'Aucune activité',
  icon: '⚪',
  tone: '#94a3b8',
  statusKey: 'no_activity' as StatusKey,
}

export default async function HRLiveOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; department?: string; q?: string }>
}) {
  await requireRole(['ceo', 'manager'])

  const filters = await searchParams
  const statusFilter = filters?.status || 'all'
  const departmentFilter = filters?.department || 'all'
  const q = (filters?.q || '').trim().toLowerCase()

  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: usersRaw } = await supabase
    .from('app_users')
    .select('id, full_name, username, role, status, department, job_title, language, last_login_at, created_at')
    .order('full_name', { ascending: true })

  const users = ((usersRaw || []) as AppUser[]).filter((user) => user.status !== 'inactive')

  const userIds = users.map((user) => user.id)

  const { data: logsRaw } = userIds.length
    ? await supabase
        .from('app_attendance_logs')
        .select('*')
        .in('user_id', userIds)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .order('created_at', { ascending: false })
    : { data: [] }

  const logs = (logsRaw || []) as AttendanceLog[]
  const logsByUser = groupLogsByUser(logs)

  const staff = users.map((user) => buildStaffStatus(user, logsByUser[user.id] || [], now))

  const departments = Array.from(
    new Set(users.map((user) => user.department).filter(Boolean).map(String))
  ).sort()

  const filteredStaff = staff.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.statusKey === statusFilter
    const matchesDepartment = departmentFilter === 'all' || item.user.department === departmentFilter
    const searchable = `${item.user.full_name || ''} ${item.user.username || ''} ${item.user.role || ''} ${item.user.department || ''} ${item.user.job_title || ''}`.toLowerCase()
    const matchesQuery = !q || searchable.includes(q)
    return matchesStatus && matchesDepartment && matchesQuery
  })

  const activeNow = staff.filter((item) => item.statusKey === 'working' || item.statusKey === 'back').length
  const onBreak = staff.filter((item) => item.statusKey === 'lunch').length
  const finished = staff.filter((item) => item.statusKey === 'out').length
  const noActivity = staff.filter((item) => item.statusKey === 'no_activity').length
  const highRisk = staff.filter((item) => item.riskLabel !== 'Normal').length

  const latestGlobalLogs = logs.slice(0, 10)
  const lateCandidates = staff.filter((item) => item.riskLabel.includes('Aucun IN') || item.riskLabel.includes('À vérifier')).slice(0, 8)

  return (
    <AppShell
      title="HR Live Control Tower"
      subtitle="Monitoring CEO en temps réel des présences, pauses, retours poste et signaux RH critiques."
      breadcrumbs={[{ label: 'HR Live Overview' }]}
      actions={
        <>
          <PageAction href="/users" variant="light">Utilisateurs</PageAction>
          <PageAction href="/">Dashboard</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div style={heroGlowStyle} />
          <div style={heroLeftStyle}>
            <div style={heroBadgeStyle}>⚡ LIVE STAFF COMMAND CENTER</div>
            <h1 style={heroTitleStyle}>Contrôle RH Global</h1>
            <p style={heroTextStyle}>
              Vue CEO instantanée : qui travaille, qui est en pause, qui a terminé, qui n’a pas encore pointé.
            </p>
            <div style={heroMetaRowStyle}>
              <span>🕒 {formatDateTime(now.toISOString())}</span>
              <span>👥 {users.length} utilisateurs actifs</span>
              <span>📡 données aujourd’hui</span>
            </div>
          </div>

          <div style={heroStatusPanelStyle}>
            <div style={liveDotRowStyle}><span style={liveDotStyle} /> LIVE OPERATIONAL SIGNAL</div>
            <div style={heroStatusGridStyle}>
              <HeroSignal label="Actifs" value={String(activeNow)} tone="#22c55e" />
              <HeroSignal label="Pause" value={String(onBreak)} tone="#f59e0b" />
              <HeroSignal label="Alertes" value={String(highRisk)} tone="#ef4444" />
            </div>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi title="En service" value={String(activeNow)} sub="IN ou retour poste" tone="#22c55e" />
          <Kpi title="En pause" value={String(onBreak)} sub="pause déjeuner active" tone="#f59e0b" />
          <Kpi title="Shift terminé" value={String(finished)} sub="OUT enregistré" tone="#ef4444" />
          <Kpi title="Aucun pointage" value={String(noActivity)} sub="aucune action aujourd’hui" tone="#94a3b8" />
          <Kpi title="Signaux à vérifier" value={String(highRisk)} sub="risque manager" tone="#7c3aed" />
        </section>

        <form style={filterPanelStyle}>
          <div style={filterTitleStyle}>Filtres Live</div>

          <label style={fieldStyle}>
            <span>Statut</span>
            <select name="status" defaultValue={statusFilter} style={inputStyle}>
              <option value="all">Tous statuts</option>
              <option value="working">En service</option>
              <option value="back">Retour poste</option>
              <option value="lunch">Pause déjeuner</option>
              <option value="out">Shift terminé</option>
              <option value="no_activity">Aucune activité</option>
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Département</span>
            <select name="department" defaultValue={departmentFilter} style={inputStyle}>
              <option value="all">Tous départements</option>
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Recherche</span>
            <input name="q" defaultValue={filters?.q || ''} placeholder="Nom, rôle, poste..." style={inputStyle} />
          </label>

          <button style={filterButtonStyle}>Appliquer</button>
        </form>

        <section style={mainGridStyle}>
          <div style={panelStyle}>
            <Header title="Live Staff Grid" subtitle="Statut actuel de chaque membre de l’équipe selon son dernier pointage du jour." />

            {filteredStaff.length ? (
              <div style={staffGridStyle}>
                {filteredStaff.map((item) => (
                  <StaffCard key={item.user.id} item={item} />
                ))}
              </div>
            ) : (
              <Empty text="Aucun utilisateur ne correspond aux filtres sélectionnés." />
            )}
          </div>

          <aside style={sidePanelStyle}>
            <Header title="CEO Alerts" subtitle="Priorités RH à contrôler immédiatement." />

            <div style={alertStackStyle}>
              {lateCandidates.length ? lateCandidates.map((item) => (
                <a key={item.user.id} href={`/users/${item.user.id}/attendance`} style={alertCardStyle(item.riskTone)}>
                  <strong>{item.user.full_name || item.user.username}</strong>
                  <span>{item.riskLabel}</span>
                  <small>{item.managerNote}</small>
                </a>
              )) : (
                <div style={goodNewsStyle}>✅ Aucun signal RH critique détecté pour le moment.</div>
              )}
            </div>
          </aside>
        </section>

        <section style={bottomGridStyle}>
          <div style={panelStyle}>
            <Header title="Derniers événements RH" subtitle="Flux des pointages les plus récents sur toute l’équipe." />
            {latestGlobalLogs.length ? (
              <div style={eventListStyle}>
                {latestGlobalLogs.map((log) => {
                  const user = users.find((u) => u.id === log.user_id)
                  const meta = ACTIONS[log.action] || DEFAULT_STATUS
                  return (
                    <a key={log.id} href={`/users/${log.user_id}/attendance`} style={eventRowStyle(meta.tone)}>
                      <span style={eventIconStyle(meta.tone)}>{meta.icon}</span>
                      <div>
                        <strong>{user?.full_name || user?.username || 'Utilisateur'}</strong>
                        <small>{meta.label} • {formatDateTime(log.created_at)}</small>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <Empty text="Aucun événement RH enregistré aujourd’hui." />
            )}
          </div>

          <div style={panelStyle}>
            <Header title="Lecture opérationnelle" subtitle="Synthèse exécutive de la journée." />
            <div style={insightGridStyle}>
              <Insight label="Couverture équipe" value={users.length ? `${Math.round(((users.length - noActivity) / users.length) * 100)}% pointés` : '0%'} />
              <Insight label="Tension présence" value={highRisk > 0 ? 'Surveillance requise' : 'Situation stable'} />
              <Insight label="Action CEO" value={highRisk > 0 ? 'Vérifier alertes' : 'Maintenir standard'} />
              <Insight label="Qualité données" value={logs.length ? 'Flux actif' : 'Aucune donnée du jour'} />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function buildStaffStatus(user: AppUser, todayLogs: AttendanceLog[], now: Date): StaffStatus {
  const sorted = [...todayLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const latest = sorted[0]
  const meta = latest ? ACTIONS[latest.action] || DEFAULT_STATUS : DEFAULT_STATUS
  const firstIn = [...todayLogs]
    .filter((log) => log.action === 'shift_in')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
  const lastOut = sorted.find((log) => log.action === 'shift_out')

  const lateLimit = new Date(now)
  lateLimit.setHours(9, 30, 0, 0)

  let riskLabel = 'Normal'
  let riskTone = '#22c55e'
  let managerNote = 'Suivi standard.'

  if (!latest) {
    riskLabel = now > lateLimit ? 'Aucun IN détecté' : 'Pas encore pointé'
    riskTone = now > lateLimit ? '#ef4444' : '#94a3b8'
    managerNote = now > lateLimit ? 'Vérifier présence ou retard.' : 'En attente de démarrage.'
  } else if (latest.action === 'lunch_start') {
    const lunchMinutes = diffMinutes(latest.created_at, now.toISOString())
    riskLabel = lunchMinutes > 75 ? 'Pause longue' : 'Pause active'
    riskTone = lunchMinutes > 75 ? '#ef4444' : '#f59e0b'
    managerNote = lunchMinutes > 75 ? 'Pause supérieure à 75 min.' : 'Pause en cours.'
  } else if (latest.action === 'shift_in' && firstIn) {
    const inDate = new Date(firstIn.created_at)
    riskLabel = inDate > lateLimit ? 'Arrivée tardive' : 'Normal'
    riskTone = inDate > lateLimit ? '#f59e0b' : '#22c55e'
    managerNote = inDate > lateLimit ? `Premier IN à ${formatTime(firstIn.created_at)}.` : 'Présence confirmée.'
  } else if (latest.action === 'shift_out') {
    riskLabel = 'Terminé'
    riskTone = '#64748b'
    managerNote = `Dernier OUT à ${formatTime(latest.created_at)}.`
  } else if (latest.action === 'lunch_end') {
    riskLabel = 'Normal'
    riskTone = '#3b82f6'
    managerNote = 'Retour au poste confirmé.'
  }

  return {
    user,
    latest,
    todayLogs: sorted,
    statusKey: meta.statusKey,
    statusLabel: meta.label,
    statusIcon: meta.icon,
    tone: meta.tone,
    riskLabel,
    riskTone,
    managerNote,
    firstIn,
    lastOut,
  }
}

function StaffCard({ item }: { item: StaffStatus }) {
  return (
    <a href={`/users/${item.user.id}/attendance`} style={staffCardStyle(item.tone)}>
      <div style={staffTopStyle}>
        <div style={avatarStyle(item.tone)}>{initials(item.user.full_name || item.user.username)}</div>
        <div style={{ minWidth: 0 }}>
          <strong style={staffNameStyle}>{item.user.full_name || item.user.username}</strong>
          <small style={staffRoleStyle}>{item.user.job_title || item.user.role || 'Staff'} • {item.user.department || '—'}</small>
        </div>
      </div>

      <div style={statusLineStyle(item.tone)}>
        <span>{item.statusIcon}</span>
        <strong>{item.statusLabel}</strong>
      </div>

      <div style={staffMetaGridStyle}>
        <div><small>Premier IN</small><strong>{item.firstIn ? formatTime(item.firstIn.created_at) : '—'}</strong></div>
        <div><small>Dernier OUT</small><strong>{item.lastOut ? formatTime(item.lastOut.created_at) : '—'}</strong></div>
      </div>

      <div style={riskPillStyle(item.riskTone)}>{item.riskLabel}</div>
    </a>
  )
}

function HeroSignal({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={heroSignalStyle(tone)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Kpi({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: string }) {
  return (
    <div style={kpiStyle(tone)}>
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

function groupLogsByUser(logs: AttendanceLog[]) {
  return logs.reduce<Record<string, AttendanceLog[]>>((acc, log) => {
    acc[log.user_id] = acc[log.user_id] || []
    acc[log.user_id].push(log)
    return acc
  }, {})
}

function initials(name?: string | null) {
  if (!name) return 'AC'
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

function diffMinutes(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000)
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(date))
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', padding: 34, borderRadius: 36, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 62%)', boxShadow: '0 35px 90px rgba(2,6,23,.42)', border: '1px solid rgba(255,255,255,.09)' }
const heroGlowStyle: React.CSSProperties = { position: 'absolute', width: 330, height: 330, top: -120, left: -120, borderRadius: 999, background: 'radial-gradient(circle,rgba(255,255,255,.24),transparent 68%)', filter: 'blur(28px)' }
const heroLeftStyle: React.CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gap: 12 }
const heroBadgeStyle: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#dbeafe', fontSize: 12, fontWeight: 950, letterSpacing: 1 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 46, fontWeight: 1000, letterSpacing: -0.9, color: '#fff', textShadow: '0 2px 14px rgba(255,255,255,.24)' }
const heroTextStyle: React.CSSProperties = { margin: 0, maxWidth: 680, color: 'rgba(255,255,255,.88)', fontSize: 15, fontWeight: 800, lineHeight: 1.65 }
const heroMetaRowStyle: React.CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', color: 'rgba(255,255,255,.94)', fontWeight: 850, fontSize: 13 }
const heroStatusPanelStyle: React.CSSProperties = { position: 'relative', zIndex: 1, minWidth: 390, padding: 22, borderRadius: 28, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', backdropFilter: 'blur(10px)', boxShadow: '0 22px 60px rgba(0,0,0,.24)' }
const liveDotRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#86efac', fontSize: 11, fontWeight: 950, letterSpacing: 1, marginBottom: 14 }
const liveDotStyle: React.CSSProperties = { width: 9, height: 9, borderRadius: 999, background: '#22c55e', boxShadow: '0 0 18px #22c55e' }
const heroStatusGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }
const heroSignalStyle = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 5, padding: 14, borderRadius: 18, background: `${tone}22`, border: `1px solid ${tone}66`, color: '#fff' })
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const kpiStyle = (tone: string): React.CSSProperties => ({ background: '#fff', border: `1px solid ${tone}33`, borderLeft: `5px solid ${tone}`, borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' })
const filterPanelStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 190px 230px 1fr auto', gap: 14, alignItems: 'end', padding: 18, borderRadius: 24, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const filterTitleStyle: React.CSSProperties = { fontSize: 21, fontWeight: 950, color: '#0f172a' }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', minWidth: 0 }
const filterButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'start' }
const bottomGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sidePanelStyle: React.CSSProperties = { ...panelStyle, position: 'sticky', top: 90 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.55 }
const staffGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const staffCardStyle = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 14, textDecoration: 'none', padding: 16, borderRadius: 22, background: `linear-gradient(180deg,#ffffff,${tone}0F)`, border: `1px solid ${tone}44`, color: '#0f172a', boxShadow: '0 12px 26px rgba(15,23,42,.04)' })
const staffTopStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center' }
const avatarStyle = (tone: string): React.CSSProperties => ({ width: 46, height: 46, borderRadius: 16, display: 'grid', placeItems: 'center', background: `${tone}22`, color: '#0f172a', border: `1px solid ${tone}66`, fontWeight: 950 })
const staffNameStyle: React.CSSProperties = { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 15 }
const staffRoleStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const statusLineStyle = (tone: string): React.CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 16, background: `${tone}18`, border: `1px solid ${tone}33`, color: '#0f172a' })
const staffMetaGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const riskPillStyle = (tone: string): React.CSSProperties => ({ width: 'fit-content', padding: '7px 10px', borderRadius: 999, background: `${tone}18`, border: `1px solid ${tone}44`, color: '#0f172a', fontSize: 12, fontWeight: 950 })
const alertStackStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const alertCardStyle = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 5, textDecoration: 'none', padding: 14, borderRadius: 18, background: `${tone}12`, border: `1px solid ${tone}44`, color: '#0f172a' })
const goodNewsStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontWeight: 900 }
const eventListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const eventRowStyle = (tone: string): React.CSSProperties => ({ display: 'flex', gap: 12, alignItems: 'center', padding: 13, borderRadius: 17, textDecoration: 'none', background: `${tone}10`, border: `1px solid ${tone}33`, color: '#0f172a' })
const eventIconStyle = (tone: string): React.CSSProperties => ({ width: 40, height: 40, borderRadius: 14, display: 'grid', placeItems: 'center', background: `${tone}22`, border: `1px solid ${tone}55` })
const insightGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const insightStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 16, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', color: '#0f172a' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
