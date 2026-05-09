import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getCurrentUser } from '@/lib/getUser'
import { getStaffPortalPhase1Data, type StaffPortalTask } from '@/lib/staff-portal-os/phase1-data'
import { getMegaStaffPortalData } from '@/lib/staff-portal-os/mega-phase7'
import StaffPortalMemoPanel from './_components/StaffPortalMemoPanel'
import {
  EnterpriseButton,
  EnterpriseHero,
  EnterpriseMetric,
  EnterpriseNavStrip,
  EnterprisePageShell,
  EnterprisePanel,
  EnterpriseRow,
  enterpriseGrid,
} from '@/components/angelcare-enterprise/EnterpriseCommandUI'

function fmtDate(value: string | null) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-MA', { weekday: 'short', day: '2-digit', month: 'short' })
}

function taskTone(task: StaffPortalTask) {
  if (task.priority === 'critical') return 'red' as const
  if (task.priority === 'high') return 'amber' as const
  if (task.priority === 'medium') return 'blue' as const
  return 'slate' as const
}

export default async function StaffHomePage() {
  const user = await getCurrentUser()
  const data = getMegaStaffPortalData(user, await getStaffPortalPhase1Data(user))

  const navItems = [
    { label: 'Command', href: '/staff-home', tone: 'blue' as const },
    { label: 'Services', href: '/staff-services', tone: 'green' as const },
    { label: 'Memos', href: '/staff-memos', tone: 'red' as const },
    { label: 'Team', href: '/team-command', tone: 'purple' as const },
    { label: 'Intelligence', href: '/staff-portal-intelligence', tone: 'cyan' as const },
    { label: 'Mega QA', href: '/staff-portal-mega-qa', tone: 'amber' as const },
    ...data.routeDensity.slice(0, 8).map((route) => ({ label: `${route.label} · ${route.count}`, href: route.href, tone: 'slate' as const })),
  ]

  return (
    <AppShell title="Staff Portal OS" subtitle="Mega enterprise staff command portal" breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }]} actions={<PageAction href="/staff-portal-command" variant="light">Command Center</PageAction>}>
      <EnterprisePageShell>
        <EnterpriseNavStrip items={navItems} />
        <EnterpriseHero
          eyebrow={`${data.persona.label} · ${data.department}`}
          title={`Welcome, ${data.displayName}`}
          subtitle={`${data.persona.mission} This master staff portal is permission-synced, role-aware, and designed as your daily operating cockpit.`}
          tone="blue"
          stats={[
            { label: 'Position', value: data.position, detail: data.roleLabel },
            { label: 'Today tasks', value: data.tasksToday.length, detail: 'Immediate load' },
            { label: 'Authorized routes', value: data.accessRoutes.length, detail: 'From user management' },
            { label: 'Control memos', value: data.memos.length, detail: 'Briefings and alerts' },
          ]}
          actions={<><EnterpriseButton href="/staff-services" tone="green">Staff Services</EnterpriseButton><EnterpriseButton href="/staff-memos" tone="red">Control Memos</EnterpriseButton><EnterpriseButton href="/team-command" tone="purple">Team Command</EnterpriseButton></>}
        />

        <div style={enterpriseGrid}>{data.executiveSignals.map((m) => <EnterpriseMetric key={m.label} {...m} />)}</div>
        <div style={{ height: 22 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 430px', gap: 20 }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <EnterprisePanel title="Role-Aware Command Zones" subtitle="Each zone routes to an operational workspace, not a generic card." tone="blue">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
                {data.commandZones.map((zone) => <EnterpriseRow key={zone.href} title={zone.title} meta={zone.detail} status="open" href={zone.href} tone={zone.tone} />)}
              </div>
            </EnterprisePanel>

            <EnterprisePanel title="My Space Control Deck" subtitle="Profile, roster, training, documents, attendance, tasks and services." tone="purple">
              <div style={enterpriseGrid}>
                {data.mySpaceLinks.map((link) => (
                  <a key={link.label} href={link.href} style={{ display: 'block', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 20, padding: 15 }}>
                    <div style={{ fontSize: 24 }}>{link.icon}</div>
                    <strong style={{ display: 'block', marginTop: 6 }}>{link.label}</strong>
                    <div style={{ color: '#64748b', fontWeight: 720, lineHeight: 1.45, marginTop: 5 }}>{link.detail}</div>
                  </a>
                ))}
              </div>
            </EnterprisePanel>

            <EnterprisePanel title="Task Command Center" subtitle="Today, this week, this month. Execute routes to the related workspace." tone="amber">
              <TaskBlock title="Today" tasks={data.tasksToday} />
              <TaskBlock title="This Week" tasks={data.tasksWeek} />
              <TaskBlock title="This Month" tasks={data.tasksMonth} />
            </EnterprisePanel>

            <EnterprisePanel title="Permission-Synced Module Density" subtitle="Horizontal access comes from user management permissions." tone="cyan">
              <div style={enterpriseGrid}>
                {data.routeDensity.slice(0, 12).map((route) => <EnterpriseMetric key={route.module} label={route.label} value={route.count} detail={route.href} tone="cyan" />)}
              </div>
            </EnterprisePanel>
          </div>

          <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
            <StaffPortalMemoPanel memos={data.memos} />
            <EnterprisePanel title="Persona Intelligence" subtitle={data.persona.briefing} tone="green">
              {data.persona.recommendedActions.map((action) => <EnterpriseRow key={action.href} title={action.label} meta={action.detail} status="recommended" href={action.href} tone="green" />)}
            </EnterprisePanel>
          </div>
        </div>
      </EnterprisePageShell>
    </AppShell>
  )
}

function TaskBlock({ title, tasks }: { title: string; tasks: StaffPortalTask[] }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: 17 }}>{title}</h3>
      {tasks.length ? tasks.slice(0, 8).map((task) => <EnterpriseRow key={`${task.source}-${task.id}`} title={task.title} meta={`${task.source} · ${fmtDate(task.date)} · ${task.detail}`} status={task.status} href={task.executeHref} tone={taskTone(task)} />) : (
        <div style={{ border: '1px dashed #cbd5e1', borderRadius: 18, padding: 16, color: '#64748b', fontWeight: 780, background: '#f8fafc' }}>No open task in this period.</div>
      )}
    </div>
  )
}
