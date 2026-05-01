import HrOsShell from '@/app/components/hr-os/HrOsShell'
import { Kpi, Panel, ActionButton, Badge, LinkButton, DataTable, inputStyle } from '@/app/components/hr-os/EliteCards'
import { createHrAction, updateHrActionStatus } from '../_actions'
import { HR_MODULES, HrModuleKey } from '../_lib/hrOsData'
import { getHrRiskLevel, getNextBestAction, getReadinessScore } from '../_lib/hrIntelligence'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export default async function HrOsModulePage({ moduleKey }: { moduleKey: HrModuleKey }) {
  await requireAccess('hr.view')

  const module = HR_MODULES[moduleKey]
  const supabase = await createClient()

  let actions: any[] = []
  try {
    const { data } = await supabase
      .from('hr_os_actions')
      .select('*')
      .eq('module', moduleKey)
      .order('created_at', { ascending: false })
      .limit(20)
    actions = data || []
  } catch {
    actions = []
  }

  const openCount = actions.filter((a) => a.status !== 'closed').length
  const highCount = actions.filter((a) => a.priority === 'high').length
  const avgReadiness = actions.length ? Math.round(actions.reduce((s, a) => s + getReadinessScore(a), 0) / actions.length) : 0

  return (
    <HrOsShell
      title={module.title}
      subtitle={module.subtitle}
      active={moduleKey}
      actions={
        <>
          <LinkButton href="/hr-os/intelligence" dark>Intelligence</LinkButton>
          <LinkButton href="/academy" dark>Academy</LinkButton>
          <LinkButton href="/missions" dark>Missions</LinkButton>
          <LinkButton href="/users" dark>Users</LinkButton>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 330px', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Command Priorities" subtitle="HR agent action queue for this module." tone="#ef4444">
            <div style={{ display: 'grid', gap: 10 }}>
              {module.priorities.map((p: string, i: number) => (
                <div key={p} style={priorityCard(i)}>
                  <strong>{p}</strong>
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 750 }}>Convert this signal into an assigned HR action.</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Workflow Gates" subtitle="Controlled operating sequence." tone="#7c3aed">
            <div style={{ display: 'grid', gap: 9 }}>
              {module.workflow.map((w: string, i: number) => (
                <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={stepDot}>{i + 1}</span>
                  <strong>{w}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {module.kpis.map(([label, value, tone]: any[]) => <Kpi key={label} label={label} value={value} tone={tone} />)}
          </div>

          <Panel title="Execution Workspace" subtitle="Create real HR actions, assign ownership, set priority and maintain an execution trace." tone="#2563eb">
            <form action={createHrAction} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 140px 155px', gap: 10 }}>
              <input type="hidden" name="module" value={moduleKey} />
              <input name="title" required placeholder="Action title: validate candidate, request document, assign owner..." style={inputStyle} />
              <input name="owner" placeholder="Owner" style={inputStyle} />
              <select name="priority" style={inputStyle}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ActionButton>Create Action</ActionButton>
              <textarea name="notes" placeholder="Execution notes, risk, context, decision rationale..." style={{ ...inputStyle, gridColumn: '1 / -1', minHeight: 86 }} />
            </form>
          </Panel>

          <Panel title="Action Register + Intelligence" subtitle="Saved actions with readiness score, risk and next-best-action guidance." tone="#16a34a">
            <DataTable
              headers={['Action', 'Owner', 'Risk', 'Readiness', 'Next Best Action', 'Control']}
              rows={actions.length ? actions.map((a) => [
                <div key="a"><strong>{a.title}</strong><br/><small style={{ color: '#64748b' }}>{a.notes || 'No notes captured'}</small></div>,
                a.owner || '—',
                <Badge key="r" tone={getHrRiskLevel(a) === 'critical' || getHrRiskLevel(a) === 'high' ? '#ef4444' : '#2563eb'}>{getHrRiskLevel(a)}</Badge>,
                <strong key="score">{getReadinessScore(a)}%</strong>,
                <small key="nba" style={{ color: '#475569', fontWeight: 800 }}>{getNextBestAction(a)}</small>,
                <form key="f" action={updateHrActionStatus} style={{ display: 'flex', gap: 6 }}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="module" value={moduleKey} />
                  <select name="status" defaultValue={a.status || 'open'} style={{ ...inputStyle, padding: 8 }}>
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="closed">closed</option>
                  </select>
                  <button style={{ border: 0, borderRadius: 10, background: '#0f172a', color: '#fff', fontWeight: 900 }}>Save</button>
                </form>
              ]) : [[
                'No action yet',
                '—',
                <Badge key="none">none</Badge>,
                '0%',
                'Create first action above',
                '—',
              ]]}
            />
          </Panel>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Risk Radar" subtitle="Signals that should trigger HR control." tone="#ef4444">
            <div style={{ display: 'grid', gap: 10 }}>
              {module.risks.map((r: string) => (
                <div key={r} style={riskRow}>
                  <Badge tone="#ef4444">Risk</Badge>
                  <strong>{r}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Module Health" subtitle="Live operating indicators." tone="#16a34a">
            <div style={{ display: 'grid', gap: 10 }}>
              <Kpi label="Open Actions" value={openCount} tone="#f59e0b" />
              <Kpi label="High Priority" value={highCount} tone="#ef4444" />
              <Kpi label="Readiness Avg." value={`${avgReadiness}%`} tone="#2563eb" />
            </div>
          </Panel>

          <Panel title="Cross-Module Tools" subtitle="Fast routes to connected OpsOS zones." tone="#0f172a">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <LinkButton href="/hr-os/intelligence">Intelligence</LinkButton>
              <LinkButton href="/academy">Academy</LinkButton>
              <LinkButton href="/missions">Missions</LinkButton>
              <LinkButton href="/caregivers">Caregivers</LinkButton>
              <LinkButton href="/reports">Reports</LinkButton>
              <LinkButton href="/incidents">Incidents</LinkButton>
              <LinkButton href="/users">Users</LinkButton>
            </div>
          </Panel>
        </div>
      </div>
    </HrOsShell>
  )
}

const priorityCard = (i: number): React.CSSProperties => ({ padding: 14, borderRadius: 17, background: i === 0 ? '#fff1f2' : '#f8fafc', border: i === 0 ? '1px solid #fecdd3' : '1px solid #dbe3ee' })
const stepDot: React.CSSProperties = { width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff', fontWeight: 950, fontSize: 12 }
const riskRow: React.CSSProperties = { display: 'grid', gap: 6, padding: 13, borderRadius: 16, background: '#fef2f2', border: '1px solid #fecaca' }
