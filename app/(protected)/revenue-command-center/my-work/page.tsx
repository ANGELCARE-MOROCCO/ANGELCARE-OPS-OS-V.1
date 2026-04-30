import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { calculateProspectSignal, calculateTaskSignal } from '../_lib/executionIntelligence'
import { ActionLink, EmptyState, Kpi, Panel, WorkCard } from '../_components/ExecutionPhase2Primitives'

export default async function MyWorkPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: tasksRaw } = await supabase.from('bd_tasks').select('*').eq('assigned_to', user?.id || '').neq('status', 'completed').order('due_at', { ascending: true })
  const { data: prospectsRaw } = await supabase.from('bd_prospects').select('*').eq('owner_id', user?.id || '').eq('is_archived', false).order('created_at', { ascending: false })

  const taskItems = (tasksRaw || []).map((task: any) => ({ type: 'task', ...task, signal: calculateTaskSignal(task) }))
  const prospectItems = (prospectsRaw || []).map((p: any) => ({ type: 'prospect', ...p, signal: calculateProspectSignal(p) }))
  const combined = [...taskItems, ...prospectItems].sort((a: any, b: any) => b.signal.score - a.signal.score)
  const critical = combined.filter((x: any) => x.signal.level === 'critical').length
  const risk = combined.filter((x: any) => x.signal.level === 'at_risk').length

  return (
    <AppShell title="My Work — Intelligence Queue" subtitle="Hard-priority execution queue ranked by delay, value, urgency, and missing next action." breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'My Work' }]} actions={<><PageAction href="/revenue-command-center/tasks/new">Create Task</PageAction><PageAction href="/revenue-command-center/tasks/board" variant="light">Task Board</PageAction></>}>
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div><div style={eyebrowStyle}>🔴 HARD PRIORITY MODE</div><h1 style={heroTitleStyle}>Execute what matters first.</h1><p style={heroTextStyle}>The system ranks your tasks and prospects so the most urgent revenue actions appear first.</p></div>
          <div style={heroPanelStyle}><strong>{critical ? 'ACTION REQUIRED NOW' : 'QUEUE STABLE'}</strong><span>{critical} critical • {risk} at risk</span></div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Critical" value={critical} sub="act now" tone="#dc2626" />
          <Kpi title="At Risk" value={risk} sub="resolve soon" tone="#d97706" />
          <Kpi title="Open Tasks" value={taskItems.length} sub="assigned to you" tone="#2563eb" />
          <Kpi title="Owned Prospects" value={prospectItems.length} sub="pipeline responsibility" tone="#7c3aed" />
        </section>

        <Panel title="Priority Queue" subtitle="Sorted automatically by execution score.">
          {combined.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>{combined.slice(0, 18).map((item: any) => <WorkCard key={`${item.type}-${item.id}`} title={item.title || item.name || 'Untitled'} description={item.signal.reason} level={item.signal.level} score={item.signal.score} href={item.type === 'task' ? `/revenue-command-center/tasks/${item.id}` : `/revenue-command-center/prospects/${item.id}`} meta={item.signal.action} />)}</div> : <EmptyState title="No active work assigned" text="Assign tasks or prospects to activate this queue." />}
        </Panel>

        <Panel title="Fast Navigation" subtitle="Move directly to the execution tools.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><ActionLink href="/revenue-command-center/tasks">All Tasks</ActionLink><ActionLink href="/revenue-command-center/prospects" variant="light">Prospects</ActionLink><ActionLink href="/revenue-command-center/cockpit" variant="light">Cockpit</ActionLink><ActionLink href="/revenue-command-center/follow-ups" variant="light">Follow-ups</ActionLink></div>
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 22, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#dc2626,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fee2e2', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#fee2e2', fontWeight: 750, maxWidth: 760, lineHeight: 1.6 }
const heroPanelStyle: React.CSSProperties = { minWidth: 260, display: 'grid', gap: 8, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
