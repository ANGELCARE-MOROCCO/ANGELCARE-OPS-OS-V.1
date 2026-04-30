import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { ActionLink, Badge, Kpi, Panel, RowLink, WorkspaceHero, dateTime, isOverdue, money, statusTone } from '../_components/BDV3Primitives'

export default async function RevenueCockpitPage() {
  const supabase = await createClient()
  const [{ data: prospects }, { data: tasks }, { data: campaigns }, { data: appointments }, { data: partnerships }] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('is_archived', false).order('updated_at', { ascending: false }).limit(50),
    supabase.from('bd_tasks').select('*').order('due_at', { ascending: true }).limit(50),
    supabase.from('bd_campaigns').select('*').order('updated_at', { ascending: false }).limit(20),
    supabase.from('bd_appointments').select('*').order('starts_at', { ascending: true }).limit(20),
    supabase.from('bd_partnerships').select('*').order('updated_at', { ascending: false }).limit(20),
  ])
  const activeProspects = prospects || []
  const allTasks = tasks || []
  const overdue = allTasks.filter((t: any) => t.status !== 'completed' && isOverdue(t.due_at))
  const working = allTasks.filter((t: any) => t.status === 'in_progress')
  const value = activeProspects.reduce((s: number, p: any) => s + Number(p.estimated_value || 0), 0)

  return <AppShell title="Revenue Master Cockpit" subtitle="One screen to coordinate business development, prospecting, campaigns, appointments and sales execution." breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Cockpit' }]} actions={<><PageAction href="/revenue-command-center/tasks/new">Create Task</PageAction><PageAction href="/revenue-command-center/business-development" variant="light">BD Workspace</PageAction></>}>
    <div style={{ display: 'grid', gap: 20 }}>
      <WorkspaceHero title="Airplane Cockpit for Revenue Execution" subtitle="Use this page during daily standups and live operations: what must be done, who owns it, where revenue risk is building, and which relationships need movement." actions={<ActionLink href="/revenue-command-center/tasks">Task Board</ActionLink>} />
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }}>
        <Kpi title="Prospects" value={String(activeProspects.length)} />
        <Kpi title="Pipeline" value={money(value)} tone="#16a34a" />
        <Kpi title="Tasks" value={String(allTasks.length)} tone="#7c3aed" />
        <Kpi title="Overdue" value={String(overdue.length)} tone="#dc2626" />
        <Kpi title="Campaigns" value={String(campaigns?.length || 0)} tone="#f59e0b" />
        <Kpi title="Partners" value={String(partnerships?.length || 0)} tone="#0ea5e9" />
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr .9fr', gap: 18 }}>
        <Panel title="Critical task radar" subtitle="Overdue and high-pressure actions.">{overdue.length ? <div style={{ display: 'grid', gap: 10 }}>{overdue.slice(0, 10).map((t: any) => <RowLink key={t.id} href={`/revenue-command-center/tasks/${t.id}`}><strong>{t.title}</strong><span>{dateTime(t.due_at)}</span><Badge tone="#dc2626">OVERDUE</Badge></RowLink>)}</div> : <div>No overdue tasks.</div>}</Panel>
        <Panel title="Pipeline movement" subtitle="Prospects needing movement."><div style={{ display: 'grid', gap: 10 }}>{activeProspects.slice(0, 10).map((p: any) => <RowLink key={p.id} href={`/revenue-command-center/prospects/${p.id}`}><strong>{p.company_name || p.contact_name || 'Prospect'}</strong><span>{p.city || 'No city'} • {p.segment || 'No segment'}</span><Badge tone={statusTone[p.status] || '#2563eb'}>{p.status}</Badge></RowLink>)}</div></Panel>
        <Panel title="Execution links" subtitle="Direct workspace access."><div style={{ display: 'grid', gap: 10 }}>{[['/revenue-command-center/prospects','Prospects'],['/revenue-command-center/campaigns','Campaigns'],['/revenue-command-center/appointments','Appointments'],['/revenue-command-center/partnerships','Partnerships'],['/revenue-command-center/market-mapping','Market Mapping'],['/revenue-command-center/strategy-room','Strategy Room']].map(([href,label]) => <ActionLink key={href} href={href} variant="light">{label}</ActionLink>)}</div></Panel>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Panel title="In progress" subtitle="Tasks actively being executed."><div style={{ display: 'grid', gap: 10 }}>{working.slice(0, 8).map((t: any) => <RowLink key={t.id} href={`/revenue-command-center/tasks/${t.id}`}><strong>{t.title}</strong><span>{dateTime(t.due_at)}</span></RowLink>)}</div></Panel>
        <Panel title="Upcoming appointments" subtitle="Meetings, visits and calls to prepare."><div style={{ display: 'grid', gap: 10 }}>{(appointments || []).slice(0, 8).map((a: any) => <RowLink key={a.id} href="/revenue-command-center/appointments"><strong>{a.title}</strong><span>{dateTime(a.starts_at)} • {a.status}</span></RowLink>)}</div></Panel>
      </section>
    </div>
  </AppShell>
}
