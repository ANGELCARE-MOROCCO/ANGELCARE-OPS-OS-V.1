import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, ModuleCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { getAllowedAppRoutes, groupRoutesByModule } from '@/lib/auth/page-access'

function low(value: unknown) {
  return String(value || '').toLowerCase()
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: unknown) {
  if (!value) return 'Not planned'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('fr-MA', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatTime(value: unknown) {
  if (!value) return '—'
  const raw = String(value)
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5)
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
}

function getDisplayName(user: any) {
  return user?.full_name || user?.name || user?.username || user?.email || 'AngelCare teammate'
}

function canAccess(user: any, permission: string) {
  const role = low(user?.role || user?.role_key)
  if (role === 'ceo') return true
  const permissions = Array.isArray(user?.permissions) ? user.permissions : []
  return permissions.includes(permission)
}

function pickPriorityAction(user: any) {
  if (canAccess(user, 'missions.view')) return { href: '/missions', label: 'Open my missions', icon: '🛫' }
  if (canAccess(user, 'revenue.view')) return { href: '/revenue-command-center/tasks', label: 'Open revenue tasks', icon: '🎯' }
  if (canAccess(user, 'sales.view')) return { href: '/sales/orders', label: 'Open sales orders', icon: '🧾' }
  if (canAccess(user, 'hr.view')) return { href: '/hr', label: 'Open HR desk', icon: '👥' }
  return { href: '/profile', label: 'Open my profile', icon: '👤' }
}

const MODULE_META: Record<string, { icon: string; text: string; accent: string }> = {
  academy: { icon: '🎓', text: 'Training, enrollment, certifications and academy operations.', accent: '#7c3aed' },
  admin: { icon: '🛡️', text: 'Administration, archive, governance and system control.', accent: '#0f172a' },
  billing: { icon: '🧾', text: 'Billing, payment follow-up and financial execution.', accent: '#0891b2' },
  caregivers: { icon: '👩‍⚕️', text: 'Caregiver workforce, availability and field readiness.', accent: '#16a34a' },
  contracts: { icon: '📦', text: 'Contracts, activation, service delivery and renewals.', accent: '#2563eb' },
  families: { icon: '🏡', text: 'Family CRM, requests, care context and follow-up.', accent: '#db2777' },
  hr: { icon: '👥', text: 'HR users, attendance, staff status and people operations.', accent: '#9333ea' },
  incidents: { icon: '🚨', text: 'Incidents, escalation, risk control and resolution.', accent: '#dc2626' },
  leads: { icon: '📈', text: 'Lead intake, qualification and conversion workflow.', accent: '#ea580c' },
  locations: { icon: '📍', text: 'Sites, branches, zones and operational geography.', accent: '#0284c7' },
  missions: { icon: '🛫', text: 'Assigned missions, planning, execution and follow-up.', accent: '#4f46e5' },
  operations: { icon: '🧭', text: 'Daily operations, availability, replacements and dispatch.', accent: '#0d9488' },
  pointage: { icon: '🕒', text: 'Attendance, pointage and shift presence control.', accent: '#ca8a04' },
  print: { icon: '🖨️', text: 'Documents, templates and print production center.', accent: '#475569' },
  profile: { icon: '👤', text: 'Personal profile, role and account information.', accent: '#64748b' },
  reports: { icon: '📊', text: 'Reports, exports, analytics and management visibility.', accent: '#0369a1' },
  'revenue-command-center': { icon: '🚀', text: 'Revenue command, tasks, prospects and campaign execution.', accent: '#1d4ed8' },
  sales: { icon: '💼', text: 'Sales cockpit, orders, clients and commercial execution.', accent: '#be123c' },
  services: { icon: '🧩', text: 'Service catalog, packages, pricing and offers.', accent: '#059669' },
  users: { icon: '🔐', text: 'Users, roles, permissions and access management.', accent: '#111827' },
  'voice-center': { icon: '☎️', text: 'Voice center, calls and communication operations.', accent: '#0284c7' },
}

export default async function StaffHomePage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const today = todayISO()
  const allowedRoutes = getAllowedAppRoutes(user)
  const groupedRoutes = groupRoutesByModule(allowedRoutes)
  const allowedModules = Object.keys(groupedRoutes)
  const priorityAction = pickPriorityAction(user)

  const [missionsRes, incidentsRes, leadsRes, contractsRes, attendanceRes] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }).limit(24),
    supabase.from('incidents').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(12),
    supabase.from('leads').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(12),
    supabase.from('contracts').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(12),
    supabase.from('attendance_logs').select('*').order('id', { ascending: false }).limit(10),
  ])

  const missions = Array.isArray(missionsRes.data) ? missionsRes.data : []
  const incidents = Array.isArray(incidentsRes.data) ? incidentsRes.data : []
  const leads = Array.isArray(leadsRes.data) ? leadsRes.data : []
  const contracts = Array.isArray(contractsRes.data) ? contractsRes.data : []
  const attendance = Array.isArray(attendanceRes.data) ? attendanceRes.data : []

  const userId = user?.id
  const myMissions = missions.filter((mission: any) => {
    const assigned = mission.assigned_to || mission.user_id || mission.agent_id || mission.owner_id || mission.caregiver_id
    return !assigned || !userId || String(assigned) === String(userId)
  })

  const todayMissions = myMissions.filter((mission: any) => mission.mission_date === today || String(mission.start_time || '').startsWith(today))
  const pendingMissions = myMissions.filter((mission: any) => !['completed', 'cancelled', 'archived', 'closed'].includes(low(mission.status)))
  const activeIncidents = incidents.filter((incident: any) => !['resolved', 'closed', 'archived'].includes(low(incident.status)))
  const pendingLeads = leads.filter((lead: any) => ['new', 'pending', 'qualified', 'open'].includes(low(lead.status)))
  const activeContracts = contracts.filter((contract: any) => !['closed', 'cancelled', 'archived'].includes(low(contract.status)))
  const latestAttendance = attendance[0]

  const briefingItems = [
    todayMissions.length ? `${todayMissions.length} mission(s) planned today.` : 'No mission detected for today yet.',
    pendingMissions.length ? `${pendingMissions.length} active mission(s) need follow-up.` : 'No pending mission risk in your visible queue.',
    activeIncidents.length ? `${activeIncidents.length} open incident(s) require attention.` : 'No open incident alert detected in the current feed.',
    allowedModules.length ? `${allowedModules.length} authorized workspace(s) available for your role.` : 'Your access is limited to profile until permissions are assigned.',
  ]

  const rosterItems = myMissions.slice(0, 8)

  const smartWidgets = [
    { label: 'My Tasks', value: pendingMissions.length, href: '/missions', sub: 'Operational execution queue', icon: '✅', show: canAccess(user, 'missions.view') },
    { label: 'Revenue Actions', value: pendingLeads.length, href: '/revenue-command-center/tasks', sub: 'Prospects, campaigns and follow-ups', icon: '🎯', show: canAccess(user, 'revenue.view') },
    { label: 'Sales Orders', value: activeContracts.length, href: '/sales/orders', sub: 'Orders and contract execution', icon: '🧾', show: canAccess(user, 'sales.view') || canAccess(user, 'contracts.view') },
    { label: 'Incidents', value: activeIncidents.length, href: '/incidents', sub: 'Risk, escalation and resolution', icon: '🚨', show: canAccess(user, 'incidents.view') },
  ].filter((item) => item.show)

  return (
    <AppShell
      title="Staff Home Command Desk"
      subtitle="Your post-login control center: permissions, attendance, assigned work, roster, memos and daily AI guidance."
      breadcrumbs={[{ label: 'Staff Home' }]}
      actions={
        <>
          <PageAction href={priorityAction.href}>{priorityAction.icon} {priorityAction.label}</PageAction>
          <PageAction href="/pointage" variant="light">Clock / Pointage</PageAction>
          <PageAction href="/profile" variant="light">My Profile</PageAction>
        </>
      }
    >
      <section style={heroStyle}>
        <div>
          <div style={heroBadgeStyle}>LIVE STAFF GATEWAY • ROLE-AWARE • PERMISSION CONTROLLED</div>
          <h1 style={heroTitleStyle}>Good day, {getDisplayName(user)}.</h1>
          <p style={heroTextStyle}>This page is your standard landing desk after login. It opens only what you are allowed to use, keeps your daily work visible, and gives you a clear operational path for the day.</p>
          <div style={heroActionRowStyle}>
            <Link href={priorityAction.href} style={primaryHeroButtonStyle}>{priorityAction.icon} Start priority work</Link>
            <Link href="/pointage" style={secondaryHeroButtonStyle}>🕒 Attendance desk</Link>
          </div>
        </div>
        <div style={heroRightStyle}>
          <div style={miniLabelStyle}>Role</div>
          <div style={roleStyle}>{user?.role || user?.role_key || 'staff'}</div>
          <div style={miniGridStyle}>
            <div style={miniCardStyle}><strong>{allowedModules.length}</strong><span>Modules</span></div>
            <div style={miniCardStyle}><strong>{todayMissions.length}</strong><span>Today</span></div>
            <div style={miniCardStyle}><strong>{activeIncidents.length}</strong><span>Alerts</span></div>
          </div>
        </div>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Allowed workspaces" value={allowedModules.length} sub="Generated from user permissions" icon="🧭" accent="#2563eb" />
        <MetricCard label="Today assignments" value={todayMissions.length} sub="Missions or tasks visible to this user" icon="📅" accent="#16a34a" />
        <MetricCard label="Open follow-ups" value={pendingMissions.length + pendingLeads.length} sub="Operational actions needing movement" icon="🎯" accent="#ea580c" />
        <MetricCard label="Attendance status" value={latestAttendance ? 'Tracked' : 'Ready'} sub={latestAttendance ? `Last activity ${formatTime(latestAttendance.created_at || latestAttendance.clock_in_at)}` : 'Open pointage to clock in/out'} icon="🕒" accent="#7c3aed" />
      </section>

      <section style={twoColumnStyle}>
        <ERPPanel title="Permitted Modules Gateway" subtitle="Only modules available to this user are shown. Each card opens the authorized workspace directly.">
          <div style={moduleGridStyle}>
            {allowedModules.length ? allowedModules.slice(0, 12).map((module) => {
              const firstRoute = groupedRoutes[module]?.[0]
              const meta = MODULE_META[module] || { icon: '🔹', text: 'Authorized operational workspace.', accent: '#334155' }
              return (
                <ModuleCard
                  key={module}
                  href={firstRoute?.href || '/profile'}
                  icon={meta.icon}
                  title={firstRoute?.moduleLabel || module.replaceAll('-', ' ')}
                  text={meta.text}
                  badge={`${groupedRoutes[module]?.length || 1} access point(s)`}
                />
              )
            }) : <EmptyState title="No module permission detected" text="Ask management to assign permissions from Users / access control." />}
          </div>
        </ERPPanel>

        <ERPPanel title="Management Memo + Notifications" subtitle="Smart memo panel for direction messages, reminders and operational alerts.">
          <div style={memoStackStyle}>
            <MemoItem tone="blue" title="Daily briefing ready" text="Review your priority work, assigned roster and open follow-ups before starting execution." />
            <MemoItem tone={activeIncidents.length ? 'red' : 'green'} title={activeIncidents.length ? 'Incident attention required' : 'No critical incident in your feed'} text={activeIncidents.length ? 'Open the incident center and resolve or escalate the highest-risk item first.' : 'Continue normal operations and keep documentation updated.'} />
            <MemoItem tone="amber" title="Management reminder" text="Keep notes, outcomes and status updates synced after every client, family, mission or revenue action." />
          </div>
        </ERPPanel>
      </section>

      <section style={twoColumnStyle}>
        <ERPPanel title="AI Staff Assistant Panel" subtitle="Role-aware guide to help the agent understand what to do next.">
          <div style={assistantBoxStyle}>
            <div style={assistantIconStyle}>✨</div>
            <div>
              <h3 style={assistantTitleStyle}>Recommended next move</h3>
              <p style={assistantTextStyle}>{todayMissions.length ? 'Start with today assigned missions, confirm timing, then update progress after each action.' : pendingMissions.length ? 'Clear pending mission follow-ups first, then review notifications and memos.' : 'Begin with attendance, review your authorized workspaces, then open your priority module.'}</p>
            </div>
          </div>
          <div style={briefingListStyle}>
            {briefingItems.map((item) => <div key={item} style={briefingItemStyle}>• {item}</div>)}
          </div>
        </ERPPanel>

        <ERPPanel title="Operational Quick Widgets" subtitle="Clickable shortcuts connected to the work queues this user can access.">
          <div style={widgetGridStyle}>
            {smartWidgets.length ? smartWidgets.map((item) => (
              <Link href={item.href} key={item.label} style={widgetCardStyle}>
                <div style={widgetIconStyle}>{item.icon}</div>
                <div style={widgetValueStyle}>{item.value}</div>
                <div style={widgetLabelStyle}>{item.label}</div>
                <div style={widgetSubStyle}>{item.sub}</div>
              </Link>
            )) : <EmptyState title="No quick queue yet" text="Your role has no task widgets yet. Use profile or assigned module access." />}
          </div>
        </ERPPanel>
      </section>

      <ERPPanel title="My Roster Calendar" subtitle="Large staff roster display based on missions/assignments visible to the current user.">
        <div style={rosterGridStyle}>
          {rosterItems.length ? rosterItems.map((mission: any, index: number) => (
            <Link href={mission.id ? `/missions/${mission.id}` : '/missions'} key={mission.id || index} style={rosterCardStyle}>
              <div style={rosterDateStyle}>{formatDate(mission.mission_date || mission.start_time || mission.created_at)}</div>
              <div style={rosterTitleStyle}>{mission.title || mission.name || mission.service_name || 'Assigned mission'}</div>
              <div style={rosterMetaStyle}>{formatTime(mission.start_time)} → {formatTime(mission.end_time)} · {mission.location || mission.city || 'Location to confirm'}</div>
              <div style={rosterFooterStyle}>
                <StatusPill tone={low(mission.status) === 'completed' ? 'green' : low(mission.status) === 'cancelled' ? 'red' : 'blue'}>{mission.status || 'planned'}</StatusPill>
                <span>Open details →</span>
              </div>
            </Link>
          )) : <EmptyState title="No roster item visible" text="When admin assigns missions, shifts or roster records, they will appear here as clickable cards." />}
        </div>
      </ERPPanel>
    </AppShell>
  )
}

function MemoItem({ tone, title, text }: { tone: 'blue' | 'green' | 'red' | 'amber'; title: string; text: string }) {
  const colors = {
    blue: ['#eff6ff', '#1d4ed8', '#bfdbfe'],
    green: ['#f0fdf4', '#15803d', '#bbf7d0'],
    red: ['#fef2f2', '#b91c1c', '#fecaca'],
    amber: ['#fffbeb', '#b45309', '#fde68a'],
  } as const
  const c = colors[tone]
  return <div style={{ ...memoItemStyle, background: c[0], borderColor: c[2] }}><strong style={{ color: c[1] }}>{title}</strong><span>{text}</span></div>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

const heroStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr .8fr', gap: 22, alignItems: 'stretch', padding: 28, borderRadius: 30, background: 'radial-gradient(circle at top left, rgba(96,165,250,.35), transparent 34%), linear-gradient(135deg,#020617 0%,#1e3a8a 58%,#312e81 100%)', color: '#fff', boxShadow: '0 28px 70px rgba(15,23,42,.22)', overflow: 'hidden' }
const heroBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.20)', color: '#dbeafe', fontSize: 12, fontWeight: 950, letterSpacing: '.08em', marginBottom: 16 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 46, lineHeight: 1.02, fontWeight: 950, letterSpacing: '-.04em', color: '#fff' }
const heroTextStyle: React.CSSProperties = { maxWidth: 780, margin: '16px 0 0', color: '#dbeafe', fontSize: 16, lineHeight: 1.75, fontWeight: 650 }
const heroActionRowStyle: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }
const primaryHeroButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 16px', borderRadius: 16, background: '#fff', color: '#1e3a8a', fontWeight: 950, textDecoration: 'none', boxShadow: '0 14px 28px rgba(0,0,0,.18)' }
const secondaryHeroButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 16px', borderRadius: 16, background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.22)', fontWeight: 950, textDecoration: 'none' }
const heroRightStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.10)', borderRadius: 24, padding: 20, backdropFilter: 'blur(16px)' }
const miniLabelStyle: React.CSSProperties = { color: '#bfdbfe', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }
const roleStyle: React.CSSProperties = { marginTop: 8, fontSize: 28, fontWeight: 950, textTransform: 'capitalize' }
const miniGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 22 }
const miniCardStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 12, borderRadius: 16, background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.16)', textAlign: 'center', color: '#e0f2fe' }
const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16, marginTop: 20 }
const twoColumnStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .85fr', gap: 20, marginTop: 20, alignItems: 'start' }
const moduleGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const memoStackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const memoItemStyle: React.CSSProperties = { display: 'grid', gap: 6, border: '1px solid', borderRadius: 18, padding: 15, color: '#475569', fontSize: 13, lineHeight: 1.55, fontWeight: 650 }
const assistantBoxStyle: React.CSSProperties = { display: 'flex', gap: 16, padding: 18, borderRadius: 22, background: 'linear-gradient(135deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee' }
const assistantIconStyle: React.CSSProperties = { width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 18, background: '#fff', border: '1px solid #c7d2fe', fontSize: 26 }
const assistantTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }
const assistantTextStyle: React.CSSProperties = { margin: '8px 0 0', color: '#475569', fontWeight: 650, lineHeight: 1.65 }
const briefingListStyle: React.CSSProperties = { display: 'grid', gap: 10, marginTop: 16 }
const briefingItemStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', color: '#334155', fontSize: 13, fontWeight: 750 }
const widgetGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const widgetCardStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 20, border: '1px solid #dbe3ee', background: 'linear-gradient(180deg,#fff,#f8fafc)', textDecoration: 'none', boxShadow: '0 12px 26px rgba(15,23,42,.05)' }
const widgetIconStyle: React.CSSProperties = { fontSize: 24 }
const widgetValueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 32, fontWeight: 950, lineHeight: 1 }
const widgetLabelStyle: React.CSSProperties = { color: '#0f172a', fontSize: 15, fontWeight: 950 }
const widgetSubStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 650, lineHeight: 1.45 }
const rosterGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const rosterCardStyle: React.CSSProperties = { display: 'grid', gap: 10, minHeight: 170, border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, background: 'linear-gradient(180deg,#ffffff,#f8fafc)', textDecoration: 'none', boxShadow: '0 12px 28px rgba(15,23,42,.05)' }
const rosterDateStyle: React.CSSProperties = { color: '#2563eb', fontSize: 13, fontWeight: 950, textTransform: 'uppercase' }
const rosterTitleStyle: React.CSSProperties = { color: '#0f172a', fontSize: 17, fontWeight: 950, lineHeight: 1.25 }
const rosterMetaStyle: React.CSSProperties = { color: '#64748b', fontSize: 13, fontWeight: 650, lineHeight: 1.55 }
const rosterFooterStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 'auto', color: '#2563eb', fontSize: 12, fontWeight: 900 }
const emptyStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13, fontWeight: 650 }
