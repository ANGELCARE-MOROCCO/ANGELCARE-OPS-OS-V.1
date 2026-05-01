import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import {
  ActionLink,
  Badge,
  EmptyState,
  Kpi,
  OwnerLoadCard,
  PIPELINE_STAGES,
  Panel,
  ProspectMiniCard,
  formatCurrency,
  prospectSignal,
} from '../../_components/PipelineOperatingBoardPrimitives'
import { moveProspectStage, quickPipelineTask, quickSetNextAction } from './actions'

export default async function PipelineOperatingBoardPage() {
  const supabase = await createClient()

  const [
    { data: prospectsRaw },
    { data: tasksRaw },
    { data: usersRaw },
  ] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('is_archived', false).order('updated_at', { ascending: false }),
    supabase.from('bd_tasks').select('id, related_type, related_id, status, due_at, planned_end_at'),
    supabase.from('app_users').select('id, full_name, username, role').order('full_name'),
  ])

  const prospects = prospectsRaw || []
  const tasks = tasksRaw || []
  const users = usersRaw || []
  const now = new Date().toISOString()

  const missingNext = prospects.filter((p: any) => !p.next_action && !p.next_action_at)
  const stuck = prospects.filter((p: any) => {
    const signal = prospectSignal(p)
    return signal.label.includes('STUCK') || signal.label.includes('NO NEXT')
  })
  const totalValue = prospects.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)
  const weightedValue = prospects.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0) * (Number(p.probability || 0) / 100), 0)
  const openRelatedTasks = tasks.filter((t: any) => t.related_type === 'prospect' && t.status !== 'completed')
  const overdueTasks = openRelatedTasks.filter((t: any) => (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now)

  const ownerStats = users.map((u: any) => {
    const owned = prospects.filter((p: any) => p.owner_id === u.id)
    const gaps = owned.filter((p: any) => !p.next_action && !p.next_action_at)
    const value = owned.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)
    return { owner: u, count: owned.length, overdue: gaps.length, value }
  }).filter((x: any) => x.count > 0 || x.overdue > 0)

  const unassigned = prospects.filter((p: any) => !p.owner_id)
  if (unassigned.length) {
    ownerStats.push({
      owner: null,
      count: unassigned.length,
      overdue: unassigned.filter((p: any) => !p.next_action && !p.next_action_at).length,
      value: unassigned.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0),
    })
  }

  function ownerName(id?: string) {
    const user = users.find((u: any) => u.id === id)
    return user?.full_name || user?.username || 'Unassigned'
  }

  function taskCount(prospectId: string) {
    return openRelatedTasks.filter((t: any) => t.related_id === prospectId).length
  }

  return (
    <AppShell
      title="Pipeline Operating Board"
      subtitle="A command board for prospect stages, stuck deals, owner pressure, missing next actions, and fast execution."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Prospects', href: '/revenue-command-center/prospects' }, { label: 'Pipeline' }]}
      actions={
        <>
          <PageAction href="/revenue-command-center/prospects" variant="light">Prospects List</PageAction>
          <PageAction href="/revenue-command-center/tasks/new">Create Task</PageAction>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>PIPELINE OPERATING BOARD</div>
            <h1 style={heroTitleStyle}>Move revenue through stages, not spreadsheets.</h1>
            <p style={heroTextStyle}>
              Detect stuck opportunities, missing next actions, owner overload, and revenue pressure from one operating board.
            </p>
          </div>
          <div style={heroPanelStyle}>
            <strong>{stuck.length ? 'PIPELINE INTERVENTION' : 'PIPELINE CONTROLLED'}</strong>
            <span>{missingNext.length} missing next action • {overdueTasks.length} overdue linked tasks</span>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Prospects" value={prospects.length} sub="active records" tone="#2563eb" />
          <Kpi title="Pipeline Value" value={formatCurrency(totalValue)} sub="gross estimate" tone="#16a34a" />
          <Kpi title="Weighted" value={formatCurrency(weightedValue)} sub="probability adjusted" tone="#7c3aed" />
          <Kpi title="Missing Next" value={missingNext.length} sub="discipline gaps" tone="#dc2626" />
          <Kpi title="Stuck" value={stuck.length} sub="needs manager push" tone="#d97706" />
          <Kpi title="Linked Tasks" value={openRelatedTasks.length} sub="open execution" tone="#0f172a" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr .8fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Owner Workload" subtitle="Who owns value, gaps, and pipeline pressure.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              {ownerStats.length ? ownerStats.map((s: any, i: number) => (
                <OwnerLoadCard key={s.owner?.id || `unassigned-${i}`} owner={s.owner} count={s.count} overdue={s.overdue} value={s.value} />
              )) : <EmptyState title="No owner load" text="No owned prospects yet." />}
            </div>
          </Panel>

          <Panel title="Quick Repair" subtitle="Fix missing next-action prospects quickly.">
            <div style={{ display: 'grid', gap: 10 }}>
              {missingNext.slice(0, 6).map((p: any) => (
                <form key={p.id} action={quickSetNextAction} style={repairFormStyle}>
                  <input type="hidden" name="prospect_id" value={p.id} />
                  <strong>{p.name || 'Unnamed prospect'}</strong>
                  <input name="next_action" placeholder="Next action..." style={inputStyle} />
                  <input name="next_action_at" type="datetime-local" style={inputStyle} />
                  <button type="submit" style={buttonStyle}>Repair</button>
                </form>
              ))}
              {!missingNext.length ? <EmptyState title="No repair needed" text="All prospects have next action visibility." /> : null}
            </div>
          </Panel>
        </section>

        <Panel
          title="Stage Board"
          subtitle="Each card opens the full Prospect Action Room. Use the stage controls below each lane to move records quickly."
          action={<ActionLink href="/revenue-command-center/daily-desk" variant="light">Agent Daily Desk</ActionLink>}
        >
          <div style={boardStyle}>
            {PIPELINE_STAGES.map((stage) => {
              const items = prospects.filter((p: any) => (p.stage || p.status || 'new') === stage)
              const stageValue = items.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)

              return (
                <section key={stage} style={laneStyle}>
                  <div style={laneHeaderStyle}>
                    <div>
                      <h3 style={laneTitleStyle}>{stage.toUpperCase()}</h3>
                      <p style={laneSubStyle}>{items.length} prospects • {formatCurrency(stageValue)}</p>
                    </div>
                    <Badge tone="#2563eb">{items.length}</Badge>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {items.length ? items.map((p: any) => (
                      <div key={p.id} style={{ display: 'grid', gap: 8 }}>
                        <ProspectMiniCard prospect={p} ownerName={ownerName(p.owner_id)} taskCount={taskCount(p.id)} />

                        <form action={moveProspectStage} style={stageMoveStyle}>
                          <input type="hidden" name="prospect_id" value={p.id} />
                          <select name="stage" defaultValue={stage} style={selectStyle}>
                            {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button type="submit" style={smallButtonStyle}>Move</button>
                        </form>

                        <form action={quickPipelineTask} style={stageMoveStyle}>
                          <input type="hidden" name="prospect_id" value={p.id} />
                          <input type="hidden" name="assigned_to" value={p.owner_id || ''} />
                          <input name="title" placeholder="Quick task..." style={selectStyle} />
                          <button type="submit" style={smallButtonStyle}>Task</button>
                        </form>
                      </div>
                    )) : <EmptyState title="Empty stage" text="No prospects here." />}
                  </div>
                </section>
              )
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#16a34a,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#dcfce7', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dcfce7', fontWeight: 750, maxWidth: 760, lineHeight: 1.6 }
const heroPanelStyle: React.CSSProperties = { minWidth: 320, display: 'grid', gap: 7, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const boardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(300px,1fr))', gap: 14, overflowX: 'auto', alignItems: 'start', paddingBottom: 8 }
const laneStyle: React.CSSProperties = { minHeight: 340, border: '1px solid #e2e8f0', borderRadius: 22, background: '#f8fafc', padding: 14, display: 'grid', gap: 12, alignContent: 'start' }
const laneHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }
const laneTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 15, fontWeight: 950 }
const laneSubStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontWeight: 750, fontSize: 12 }
const stageMoveStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }
const selectStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 750 }
const smallButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '10px 12px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const repairFormStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 11, borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '11px 13px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
