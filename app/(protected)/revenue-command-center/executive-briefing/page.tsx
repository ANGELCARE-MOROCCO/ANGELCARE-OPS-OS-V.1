import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, EmptyState, Kpi, Panel, SignalRow, formatDate } from '../_components/ElitePhase7Primitives'

export default async function ExecutiveBriefingPage() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: prospects }, { data: campaigns }, { data: partnerships }, { data: appointments }] = await Promise.all([
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_prospects').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_partnerships').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_appointments').select('*').order('scheduled_at', { ascending: true }),
  ])

  const now = new Date().toISOString()
  const overdue = (tasks || []).filter((t: any) => t.status !== 'completed' && (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now)
  const missingNext = (prospects || []).filter((p: any) => !p.is_archived && !p.next_action && !p.next_action_at)
  const pipelineValue = (prospects || []).reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)
  const partnerValue = (partnerships || []).reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)

  const recommendations = [
    overdue.length ? { title: 'Resolve overdue execution queue', sub: `${overdue.length} late tasks require manager intervention.`, severity: 'critical' } : null,
    missingNext.length ? { title: 'Repair pipeline discipline', sub: `${missingNext.length} prospects have no next action.`, severity: 'warning' } : null,
    (campaigns || []).length ? { title: 'Review campaign performance', sub: `${(campaigns || []).length} campaigns exist; confirm budget and KPI tracking.`, severity: 'info' } : null,
    (appointments || []).length ? { title: 'Convert meetings into next actions', sub: `${(appointments || []).length} appointments tracked. Ensure outcome logging.`, severity: 'info' } : null,
  ].filter(Boolean) as any[]

  return (
    <AppShell
      title="Executive Briefing"
      subtitle="Board-style daily briefing: risks, values, decisions, and recommended next moves."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Executive Briefing' }]}
      actions={<PageAction href="/revenue-command-center/elite-command">Elite Command</PageAction>}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }}>
          <Kpi title="Pipeline Value" value={`${pipelineValue.toLocaleString('fr-FR')} MAD`} sub="prospect estimate" tone="#16a34a" />
          <Kpi title="Partner Value" value={`${partnerValue.toLocaleString('fr-FR')} MAD`} sub="B2B estimate" tone="#7c3aed" />
          <Kpi title="Overdue" value={overdue.length} sub="execution risk" tone="#dc2626" />
          <Kpi title="No Next Action" value={missingNext.length} sub="pipeline gap" tone="#d97706" />
          <Kpi title="Campaigns" value={(campaigns || []).length} sub="growth engines" tone="#2563eb" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="Board Recommendations" subtitle="Priority decisions the leadership team should address." dense>
            <div style={{ display: 'grid', gap: 10 }}>
              {recommendations.length ? recommendations.map((r, i) => <SignalRow key={i} title={r.title} subtitle={r.sub} severity={r.severity} />) : <EmptyState title="No recommendations" text="System did not detect board-level pressure." />}
            </div>
          </Panel>

          <Panel title="Risk Register" subtitle="Top operational exposure areas." dense>
            <div style={{ display: 'grid', gap: 10 }}>
              <SignalRow title="Execution risk" subtitle={`${overdue.length} overdue tasks`} severity={overdue.length ? 'critical' : 'success'} />
              <SignalRow title="Pipeline risk" subtitle={`${missingNext.length} prospects without next action`} severity={missingNext.length ? 'warning' : 'success'} />
              <SignalRow title="Meeting conversion risk" subtitle={`${(appointments || []).length} appointments require outcome discipline`} severity="info" />
            </div>
          </Panel>
        </section>

        <Panel title="Recent Revenue Objects" subtitle="Latest tasks and prospects for executive context." dense>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Badge tone="#2563eb">Latest Tasks</Badge>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {(tasks || []).slice(0, 6).map((t: any) => <SignalRow key={t.id} title={t.title || 'Untitled task'} subtitle={`${t.status || 'open'} • ${formatDate(t.created_at)}`} severity={t.status === 'completed' ? 'success' : 'info'} href={`/revenue-command-center/tasks/${t.id}`} />)}
              </div>
            </div>
            <div>
              <Badge tone="#7c3aed">Latest Prospects</Badge>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {(prospects || []).slice(0, 6).map((p: any) => <SignalRow key={p.id} title={p.name || 'Unnamed prospect'} subtitle={`${p.segment || 'No segment'} • ${Number(p.estimated_value || 0).toLocaleString('fr-FR')} MAD`} severity={!p.next_action && !p.next_action_at ? 'warning' : 'success'} href={`/revenue-command-center/prospects/${p.id}`} />)}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}
