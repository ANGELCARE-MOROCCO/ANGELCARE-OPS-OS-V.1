import type { CSSProperties, ReactNode } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAc360FoundationQualityDashboard } from '@/lib/ac360/phase1f-quality-gate'

export const dynamic = 'force-dynamic'

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function statusStyle(status: string): CSSProperties {
  if (['ready', 'passed', 'qa_locked', 'policy_locked', 'guarded', 'wired'].includes(status)) return okPillStyle
  if (['warning', 'pending', 'pending_phase2', 'skipped', 'waived'].includes(status)) return warnPillStyle
  return dangerPillStyle
}

export default async function Ac360DeploymentGatePage() {
  const result = await getAc360FoundationQualityDashboard()
  const dashboard = result.dashboard || {}
  const latestRun: any = dashboard.latestRun || null
  const results: any[] = dashboard.results || []
  const gates: any[] = dashboard.gates || []
  const matrix: any[] = dashboard.matrix || []
  const engineCoverage: any[] = dashboard.engineCoverage || []
  const events: any[] = dashboard.events || []
  const rules: any[] = dashboard.rules || []
  const readinessScore = n(latestRun?.readiness_score)
  const failed = results.filter((row) => row.status === 'failed')
  const warnings = results.filter((row) => row.status === 'warning')
  const readyGates = gates.filter((gate) => ['ready', 'waived'].includes(gate.status)).length
  const phase1Covered = engineCoverage.filter((row) => row.must_pass_phase1 && ['seeded','wired','guarded','policy_locked','qa_locked'].includes(row.coverage_status)).length

  return (
    <AppShell
      title="AngelCare 360 Deployment Gate"
      subtitle="Phase 1F foundation QA, coverage matrix and deployment gate. This is the last safety lock before Phase 2 school operations."
      breadcrumbs={[{ label: 'AngelCare 360' }, { label: 'Phase 1F Deployment Gate' }]}
      actions={<><PageAction href="/angelcare-360/policy-lock" variant="light">Policy Lock</PageAction><PageAction href="/angelcare-360/action-wiring" variant="light">Action Wiring</PageAction><PageAction href="/api/ac360/qa/dashboard" variant="light">QA API</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>AC360-PH1F-FOUNDATION-QA-DEPLOYMENT-GATE</div>
            <h1 style={heroTitleStyle}>Phase 1 is now deployment-gated before school modules begin.</h1>
            <p style={heroTextStyle}>This page keeps the build strictly inside the foundation plan. It checks the SQL stack, 52-engine doctrine, billing catalog, entitlement backbone, guard chain, real action wiring, policy lock, usage credits, audit traceability and route coverage. Phase 2 should only start when this gate is green or deliberately waived by governance.</p>
          </div>
          <div style={statusCardStyle}>
            <span>Active organization</span>
            <strong>{result.context?.org?.display_name || 'Not resolved'}</strong>
            <small>{result.context?.subscription?.status || 'no subscription'} • {result.context?.wallet?.balance ?? '—'} credits</small>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Readiness score" value={latestRun ? `${readinessScore}%` : 'Not run'} sub="Phase 1F QA score" />
          <Kpi label="Gate status" value={latestRun?.gate_status || 'pending'} sub={dashboard.phase2Allowed ? 'Phase 2 entry allowed' : 'Phase 2 still blocked'} />
          <Kpi label="QA checks" value={`${latestRun?.passed_checks || 0}/${latestRun?.total_checks || 0}`} sub={`${failed.length} failed • ${warnings.length} warnings`} />
          <Kpi label="Deployment gates" value={`${readyGates}/${gates.length || 0}`} sub="required gates ready/waived" />
          <Kpi label="Phase 1 engines" value={`${phase1Covered}/${dashboard.phase1EngineCount || 44}`} sub={`52-engine doctrine: ${dashboard.expectedEngineCount || 52}`} />
        </section>

        <Panel title="Phase 1F doctrine checkpoint" subtitle="The locked AC360 production flow must remain the same until deployment. Nothing serious executes before these checks.">
          <div style={flowGridStyle}>
            {(dashboard.doctrine || []).map((step: string, index: number) => <div key={step} style={flowCardStyle}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></div>)}
          </div>
        </Panel>

        <section style={splitStyle}>
          <Panel title="Deployment gate status" subtitle="These gates control whether we are allowed to enter Phase 2 school operations.">
            <div style={cardsListStyle}>
              {gates.map((gate: any) => (
                <div key={gate.gate_key} style={gate.status === 'ready' ? goodRowStyle : gate.status === 'blocked' ? dangerRowStyle : rowStyle}>
                  <div>
                    <b>{gate.gate_name}</b>
                    <small>{gate.gate_key} • {gate.gate_family}</small>
                    <em>{gate.blocking_reason || 'No blocking reason.'}</em>
                  </div>
                  <strong style={statusStyle(gate.status)}>{gate.status}</strong>
                </div>
              ))}
              {!gates.length ? <Empty text="No deployment gates loaded. Apply Phase 1F migration." /> : null}
            </div>
          </Panel>

          <Panel title="Latest QA results" subtitle="Failures here block Phase 2. Warnings must be reviewed, but may not always block deployment.">
            <div style={cardsListStyle}>
              {results.slice(0, 60).map((check: any) => (
                <div key={check.id || check.check_key} style={check.status === 'passed' ? goodRowStyle : check.status === 'failed' ? dangerRowStyle : warnRowStyle}>
                  <div>
                    <b>{check.title}</b>
                    <small>{check.check_key} • {check.check_family} • {check.severity}</small>
                    <em>{check.actual_value || '—'} / expected: {check.expected_value || '—'}</em>
                    {check.remediation ? <em>{check.remediation}</em> : null}
                  </div>
                  <strong style={statusStyle(check.status)}>{check.status}</strong>
                </div>
              ))}
              {!results.length ? <Empty text="No QA run yet. POST /api/ac360/qa/run after SQL is applied." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="Foundation gate matrix" subtitle="This is the controlled checklist for the end of Phase 1. It prevents drifting into school features before the commercial backbone is stable.">
          <div style={matrixTableStyle}>
            <MatrixHeader />
            {matrix.map((row: any) => (
              <div key={row.matrix_key} style={matrixRowStyle}>
                <div><b>{row.gate_label}</b><small>{row.matrix_key}</small></div>
                <div>{row.gate_family}</div>
                <div>{row.required ? 'Required' : 'Optional'}</div>
                <strong style={row.severity === 'critical' ? dangerPillStyle : warnPillStyle}>{row.severity}</strong>
              </div>
            ))}
            {!matrix.length ? <Empty text="No gate matrix loaded." /> : null}
          </div>
        </Panel>

        <section style={splitStyle}>
          <Panel title="Engine coverage matrix" subtitle="Phase 1 engines must be covered. Phase 2+ engines stay registered as planned, but they do not block this foundation gate.">
            <div style={engineGridStyle}>
              {engineCoverage.slice(0, 80).map((engine: any) => (
                <div key={engine.engine_code} style={engine.must_pass_phase1 ? engineCardStyle : plannedCardStyle}>
                  <b>{engine.engine_code}</b>
                  <span>{engine.engine_name}</span>
                  <small>{engine.system_name}</small>
                  <strong style={statusStyle(engine.coverage_status)}>{engine.coverage_status}</strong>
                </div>
              ))}
              {!engineCoverage.length ? <Empty text="No engine coverage rows loaded." /> : null}
            </div>
          </Panel>

          <Panel title="Phase 1F automation rules & events" subtitle="The gate creates events and rules that block Phase 2 when the foundation is not ready.">
            <div style={cardsListStyle}>
              {rules.map((rule: any) => <div key={rule.rule_key} style={rowStyle}><div><b>{rule.label}</b><small>{rule.trigger_event}</small></div><strong>{rule.status}</strong></div>)}
              {events.slice(0, 30).map((event: any) => (
                <div key={event.id} style={event.status === 'ready' || event.status === 'passed' ? goodRowStyle : event.status === 'blocked' || event.status === 'failed' ? dangerRowStyle : rowStyle}>
                  <div><b>{event.event_key}</b><small>{event.gate_key || 'no gate'} • {new Date(event.created_at).toLocaleString('fr-MA')}</small><em>{event.message}</em></div>
                  <strong>{event.status}</strong>
                </div>
              ))}
              {!rules.length && !events.length ? <Empty text="No Phase 1F rules/events yet." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="How to execute Phase 1F gate" subtitle="Run these only after Phase 1F SQL is applied. The POST routes themselves are wired through the AC360 guard chain.">
          <pre style={codeStyle}>{`// Run QA
fetch('/api/ac360/qa/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orgId: '${result.context?.org?.id || 'YOUR_ORG_ID'}' })
}).then(r => r.json()).then(console.log)

// Evaluate final deployment gate
fetch('/api/ac360/deployment-gate/evaluate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orgId: '${result.context?.org?.id || 'YOUR_ORG_ID'}' })
}).then(r => r.json()).then(console.log)`}</pre>
        </Panel>

        {dashboard.errors?.length ? <section style={warningStyle}><strong>Dashboard loaded with warnings.</strong><span>{dashboard.errors.join(' | ')}</span></section> : null}
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
}
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section style={panelStyle}><div style={panelHeadStyle}><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{children}</section>
}
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }
function MatrixHeader() { return <div style={{ ...matrixRowStyle, ...headerRowStyle }}><b>Gate</b><b>Family</b><b>Required</b><b>Severity</b></div> }

const pageStyle: CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 18, alignItems: 'stretch' }
const badgeStyle: CSSProperties = { display: 'inline-block', padding: '7px 10px', borderRadius: 999, background: '#eaf2ff', color: '#0b3b78', fontSize: 11, fontWeight: 900, letterSpacing: '.08em' }
const heroTitleStyle: CSSProperties = { margin: '12px 0 8px', fontSize: 32, lineHeight: 1.05, color: '#0f172a', letterSpacing: '-0.04em' }
const heroTextStyle: CSSProperties = { margin: 0, color: '#475569', lineHeight: 1.7, maxWidth: 940 }
const statusCardStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 22, padding: 18, background: 'linear-gradient(180deg,#ffffff,#eff6ff)', display: 'grid', gap: 8, alignContent: 'center', boxShadow: '0 16px 40px rgba(15,23,42,.08)' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const kpiStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, background: '#fff', display: 'grid', gap: 6, boxShadow: '0 10px 25px rgba(15,23,42,.05)' }
const panelStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 22, background: '#fff', padding: 18, boxShadow: '0 14px 35px rgba(15,23,42,.06)' }
const panelHeadStyle: CSSProperties = { marginBottom: 12 }
const splitStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const cardsListStyle: CSSProperties = { display: 'grid', gap: 10 }
const rowStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, background: '#f8fafc' }
const goodRowStyle: CSSProperties = { ...rowStyle, borderColor: '#bbf7d0', background: '#f0fdf4' }
const warnRowStyle: CSSProperties = { ...rowStyle, borderColor: '#fde68a', background: '#fffbeb' }
const dangerRowStyle: CSSProperties = { ...rowStyle, borderColor: '#fecaca', background: '#fff1f2' }
const okPillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 9px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }
const warnPillStyle: CSSProperties = { ...okPillStyle, background: '#fef3c7', color: '#92400e' }
const dangerPillStyle: CSSProperties = { ...okPillStyle, background: '#fee2e2', color: '#991b1b' }
const emptyStyle: CSSProperties = { padding: 16, color: '#64748b', background: '#f8fafc', borderRadius: 14 }
const codeStyle: CSSProperties = { whiteSpace: 'pre-wrap', margin: 0, background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 16, fontSize: 12, lineHeight: 1.7 }
const warningStyle: CSSProperties = { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', borderRadius: 16, padding: 14, display: 'grid', gap: 4 }
const flowGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }
const flowCardStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 16, background: '#eff6ff', padding: 12, display: 'grid', gap: 6, color: '#0f3767' }
const matrixTableStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }
const matrixRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.8fr .7fr .5fr .5fr', gap: 12, padding: '12px 14px', borderTop: '1px solid #e2e8f0', alignItems: 'center', fontSize: 13 }
const headerRowStyle: CSSProperties = { background: '#0f3767', color: '#fff', borderTop: 0, fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase' }
const engineGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, maxHeight: 640, overflow: 'auto', paddingRight: 4 }
const engineCardStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#f8fbff', borderRadius: 14, padding: 12, display: 'grid', gap: 5 }
const plannedCardStyle: CSSProperties = { ...engineCardStyle, borderColor: '#e2e8f0', background: '#f8fafc' }
