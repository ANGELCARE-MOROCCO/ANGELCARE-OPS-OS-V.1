import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { ActionLink, Badge, Kpi, Panel, RowLink, WorkspaceHero, dateTime, isOverdue, money, statusTone } from '../_components/BDV3Primitives'

export default async function BusinessDevelopmentWorkspace() {
  const supabase = await createClient()
  const [{ data: prospects }, { data: tasks }, { data: campaigns }, { data: appointments }, { data: partnerships }] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('is_archived', false).order('created_at', { ascending: false }).limit(12),
    supabase.from('bd_tasks').select('*').order('due_at', { ascending: true }).limit(12),
    supabase.from('bd_campaigns').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('bd_appointments').select('*').order('starts_at', { ascending: true }).limit(8),
    supabase.from('bd_partnerships').select('*').order('updated_at', { ascending: false }).limit(8),
  ])

  const openTasks = (tasks || []).filter((t: any) => t.status !== 'completed').length
  const overdueTasks = (tasks || []).filter((t: any) => t.status !== 'completed' && isOverdue(t.due_at)).length
  const hotValue = (prospects || []).reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)

  return (
    <AppShell title="Business Development Workspace" subtitle="Corporate growth workspace for B2B/B2C prospecting, campaigns, partnerships, appointments, tasks and execution." breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Business Development' }]} actions={<><PageAction href="/revenue-command-center/tasks/new">New Task</PageAction><PageAction href="/revenue-command-center/prospects/new" variant="light">New Prospect</PageAction></>}>
      <div style={{ display: 'grid', gap: 20 }}>
        <WorkspaceHero title="BD Operating Cockpit" subtitle="A central workspace for agents and managers to map markets, build prospect databases, execute campaigns, follow appointments, assign tasks and convert corporate opportunities." actions={<><ActionLink href="/revenue-command-center/cockpit">Open Master Cockpit</ActionLink><ActionLink href="/revenue-command-center/strategy-room" variant="light">Strategy Room</ActionLink></>} />

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Prospects" value={String(prospects?.length || 0)} sub="active sample" />
          <Kpi title="Open tasks" value={String(openTasks)} sub="execution load" tone="#7c3aed" />
          <Kpi title="Overdue" value={String(overdueTasks)} sub="requires action" tone="#dc2626" />
          <Kpi title="Pipeline value" value={money(hotValue)} sub="estimated prospect value" tone="#16a34a" />
          <Kpi title="Campaigns" value={String(campaigns?.length || 0)} sub="active/planning" tone="#f59e0b" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
          <Panel title="Mission Control Navigation" subtitle="Use these as operational workspaces, not static pages.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              {[
                ['/revenue-command-center/prospects', 'Prospect Database', 'Segmentation, ownership, qualification, pipeline and profiles.'],
                ['/revenue-command-center/tasks', 'Task Command Board', 'Daily execution, timers, owners, comments and linked records.'],
                ['/revenue-command-center/campaigns', 'Campaign Engine', 'B2B/B2C campaigns, targets, results, playbooks and actions.'],
                ['/revenue-command-center/appointments', 'Appointments Desk', 'Meetings, visits, calls, outcomes and next actions.'],
                ['/revenue-command-center/partnerships', 'Partnership Pipeline', 'Schools, clinics, companies, institutions and B2B relationships.'],
                ['/revenue-command-center/market-mapping', 'Market Mapping', 'Cities, segments, competition, potential and domination plan.'],
              ].map(([href, title, text]) => <RowLink key={href} href={href}><strong>{title}</strong><span style={{ color: '#64748b', fontWeight: 750 }}>{text}</span></RowLink>)}
            </div>
          </Panel>

          <Panel title="CEO Execution Alerts" subtitle="Signals that need action today.">
            <div style={{ display: 'grid', gap: 10 }}>
              <Badge tone={overdueTasks ? '#dc2626' : '#16a34a'}>{overdueTasks ? `${overdueTasks} overdue tasks` : 'No overdue task in sample'}</Badge>
              <Badge tone={(prospects?.length || 0) < 5 ? '#f59e0b' : '#16a34a'}>{(prospects?.length || 0) < 5 ? 'Prospect database needs expansion' : 'Prospect base active'}</Badge>
              <Badge tone="#2563eb">Campaigns must be linked to daily actions</Badge>
              <Badge tone="#7c3aed">Partnership pipeline should drive B2B meetings</Badge>
            </div>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 18 }}>
          <Panel title="Hot prospects" subtitle="Recently created prospects.">
            <div style={{ display: 'grid', gap: 10 }}>{(prospects || []).slice(0, 6).map((p: any) => <RowLink key={p.id} href={`/revenue-command-center/prospects/${p.id}`}><strong>{p.company_name || p.contact_name || 'Unnamed prospect'}</strong><span>{p.segment || 'No segment'} • {money(p.estimated_value)}</span><Badge tone={statusTone[p.status] || '#2563eb'}>{p.status || 'new'}</Badge></RowLink>)}</div>
          </Panel>
          <Panel title="Today tasks" subtitle="Execution queue.">
            <div style={{ display: 'grid', gap: 10 }}>{(tasks || []).slice(0, 6).map((t: any) => <RowLink key={t.id} href={`/revenue-command-center/tasks/${t.id}`}><strong>{t.title}</strong><span>{dateTime(t.due_at)}</span><Badge tone={isOverdue(t.due_at) && t.status !== 'completed' ? '#dc2626' : statusTone[t.status] || '#2563eb'}>{t.status}</Badge></RowLink>)}</div>
          </Panel>
          <Panel title="Appointments / Partnerships" subtitle="External growth rhythm.">
            <div style={{ display: 'grid', gap: 10 }}>{(appointments || []).slice(0, 3).map((a: any) => <RowLink key={a.id} href="/revenue-command-center/appointments"><strong>{a.title}</strong><span>{dateTime(a.starts_at)}</span></RowLink>)}{(partnerships || []).slice(0, 3).map((p: any) => <RowLink key={p.id} href="/revenue-command-center/partnerships"><strong>{p.organization}</strong><span>{p.stage} • {money(p.potential_value)}</span></RowLink>)}</div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}
