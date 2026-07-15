import type { CSSProperties, ReactNode } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAc360GuardrailsCenter } from '@/lib/ac360/guard'
import { AC360_CRITICAL_FLOW } from '@/lib/ac360/constants'

export const dynamic = 'force-dynamic'

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export default async function Ac360GuardrailsPage() {
  const result = await getAc360GuardrailsCenter()
  const context = result.context
  const org = context?.org
  const guardrails = result.guardrails
  const decisions = guardrails?.decisions || []
  const allowed = decisions.filter((row: any) => row.allowed).length
  const blocked = decisions.filter((row: any) => !row.allowed).length
  const meteredActions = (guardrails?.actions || []).filter((action: any) => action.meter_key).length
  const capacityActions = (guardrails?.actions || []).filter((action: any) => action.metadata_json?.capacity_key).length

  return (
    <AppShell
      title="AngelCare 360 Guardrails"
      subtitle="Phase 1C production guard wiring: every serious action must pass organization, subscription, entitlement, capacity, credits, usage and audit checks."
      breadcrumbs={[{ label: 'AngelCare 360' }, { label: 'Phase 1C Guardrails' }]}
      actions={<><PageAction href="/angelcare-360/billing-center" variant="light">Billing Center</PageAction><PageAction href="/angelcare-360/foundation" variant="light">Foundation</PageAction><PageAction href="/api/ac360/guard/check" variant="light">Guard API</PageAction></>}
    >
      <div style={pageStyle}>
        {!context ? (
          <section style={warningStyle}>
            <strong>AC360 tenant context not found.</strong>
            <span>Bootstrap Phase 1B first, then refresh this guardrails center.</span>
          </section>
        ) : null}

        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>AC360-PH1C-PRODUCTION-GUARD-WIRING</div>
            <h1 style={heroTitleStyle}>Guard every production button before it can execute.</h1>
            <p style={heroTextStyle}>The next build rule is strict: school actions should not directly create records, send messages, upload files, generate reports or activate modules. They must first call the AC360 guard chain and only execute when the decision is allowed.</p>
          </div>
          <div style={statusCardStyle}>
            <span>Active organization</span>
            <strong>{org?.display_name || 'Not bootstrapped'}</strong>
            <small>{org?.org_code || '—'} • {org?.status || '—'}</small>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Registered actions" value={guardrails?.actions?.length || 0} sub="guardable production actions" />
          <Kpi label="Metered actions" value={meteredActions} sub="credits / usage checked" />
          <Kpi label="Capacity actions" value={capacityActions} sub="students / staff / campus / storage" />
          <Kpi label="Allowed checks" value={allowed} sub="recent guard decisions" />
          <Kpi label="Blocked checks" value={blocked} sub="upgrade / top-up / restriction" />
          <Kpi label="Active restrictions" value={guardrails?.restrictions?.length || 0} sub="account governance" />
        </section>

        <Panel title="Strict production action flow" subtitle="This is the exact doctrine locked for AngelCare 360. All serious future endpoints and buttons must follow it.">
          <div style={flowGridStyle}>
            {AC360_CRITICAL_FLOW.map((step, index) => (
              <div key={step} style={flowCardStyle}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></div>
            ))}
          </div>
        </Panel>

        <section style={splitStyle}>
          <Panel title="Guarded action registry" subtitle="Phase 1C expands the registry from a billing catalog into a real production gate catalog for school operations and Growth Menu modules.">
            <div style={tableStyle}>
              <Header cols={["Action", "Feature", "Meter", "Guard"]} />
              {(guardrails?.actions || []).slice(0, 80).map((action: any) => (
                <Row key={action.action_key} cols={[
                  <div key="a"><b>{action.label}</b><small>{action.action_key}</small></div>,
                  action.feature_key,
                  action.meter_key || '—',
                  action.metadata_json?.capacity_key ? `capacity: ${action.metadata_json.capacity_key}` : action.restriction_behavior,
                ]} />
              ))}
              {!(guardrails?.actions || []).length ? <Empty text="No guarded actions loaded. Apply Phase 1C migration." /> : null}
            </div>
          </Panel>

          <Panel title="Latest guard decisions" subtitle="Every guard check leaves a decision row and an audit event so failed actions are explainable, billable, and supportable.">
            <div style={cardsListStyle}>
              {decisions.slice(0, 30).map((decision: any) => (
                <div key={decision.id} style={decision.allowed ? goodRowStyle : dangerRowStyle}>
                  <div><b>{decision.action_key}</b><small>{decision.guard_stage} • {decision.feature_key || 'no feature'} • {decision.meter_key || 'no meter'}</small></div>
                  <strong>{decision.allowed ? 'ALLOWED' : decision.decision}</strong>
                </div>
              ))}
              {!decisions.length ? <Empty text="No guard decisions yet. Use POST /api/ac360/guard/check or wire a real action." /> : null}
            </div>
          </Panel>
        </section>

        <section style={splitStyle}>
          <Panel title="Capacity snapshots" subtitle="Capacity snapshots let the guard block new students, staff, classes, campuses or storage uploads before limits are broken.">
            <div style={cardsListStyle}>
              {(guardrails?.capacities || []).slice(0, 20).map((cap: any) => (
                <div key={cap.id} style={rowStyle}>
                  <div><b>{cap.capacity_key}</b><small>{cap.source_table || 'manual/live'} • {new Date(cap.measured_at).toLocaleString('fr-MA')}</small></div>
                  <strong>{n(cap.current_value)} / {cap.limit_value == null ? '∞' : n(cap.limit_value)}</strong>
                </div>
              ))}
              {!(guardrails?.capacities || []).length ? <Empty text="No capacity snapshots yet. Use POST /api/ac360/capacity/snapshot." /> : null}
            </div>
          </Panel>

          <Panel title="Guard automation rules" subtitle="These rules convert guard events into recommendations, restrictions, top-ups, usage records and audit logs.">
            <div style={cardsListStyle}>
              {(guardrails?.rules || []).map((rule: any) => (
                <div key={rule.rule_key} style={rowStyle}>
                  <div><b>{rule.label}</b><small>{rule.trigger_event}</small></div>
                  <strong>{rule.status}</strong>
                </div>
              ))}
              {!(guardrails?.rules || []).length ? <Empty text="No Phase 1C guard rules loaded yet." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="How to wire real endpoints now" subtitle="Use this exact pattern for all upcoming AC360 actions. The guard check is not decorative; it is the permission, capacity, usage and billing preflight.">
          <pre style={codeStyle}>{`// Server route / action pattern
import { runAc360GuardedAction } from '@/lib/ac360/guard'

const result = await runAc360GuardedAction(
  {
    orgId,
    actionKey: 'student.create',
    quantity: 1,
    currentCapacity: currentActiveStudents,
    idempotencyKey: requestId,
    metadata: { source: 'students.create.route' }
  },
  async () => {
    // perform the real insert/update/send only here
    return await createStudent(payload)
  }
)

if (!result.ok) {
  return NextResponse.json({ ok: false, guard: result.guard }, { status: 402 })
}`}</pre>
        </Panel>

        {guardrails?.errors?.length ? (
          <section style={warningStyle}>
            <strong>Guardrails center loaded with warnings.</strong>
            <span>{guardrails.errors.join(' | ')}</span>
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section style={panelStyle}><div style={panelHeaderStyle}><div><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div></div>{children}</section>
}

function Header({ cols }: { cols: string[] }) {
  return <div style={tableHeaderStyle}>{cols.map((col) => <b key={col}>{col}</b>)}</div>
}

function Row({ cols }: { cols: ReactNode[] }) {
  return <div style={tableRowStyle}>{cols.map((col, index) => <div key={index}>{col}</div>)}</div>
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const pageStyle: CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 22, alignItems: 'stretch', padding: 32, borderRadius: 34, background: 'linear-gradient(135deg,#0f2747,#0f4c81 55%,#166534)', color: '#fff', boxShadow: '0 30px 80px rgba(15,23,42,.20)' }
const badgeStyle: CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#dbeafe', fontSize: 12, fontWeight: 950, marginBottom: 14 }
const heroTitleStyle: CSSProperties = { margin: 0, fontSize: 38, lineHeight: 1.05, fontWeight: 950, letterSpacing: -0.8 }
const heroTextStyle: CSSProperties = { margin: '14px 0 0', color: '#dbeafe', fontWeight: 760, lineHeight: 1.55, maxWidth: 920 }
const statusCardStyle: CSSProperties = { display: 'grid', gap: 8, alignContent: 'center', padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.20)' }
const warningStyle: CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 22, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontWeight: 800 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 45px rgba(15,23,42,.06)' }
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 28, padding: 22, boxShadow: '0 20px 55px rgba(15,23,42,.07)' }
const panelHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }
const sectionTitleStyle: CSSProperties = { margin: 0, color: '#0f2747', fontSize: 20, fontWeight: 950 }
const sectionTextStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 700, lineHeight: 1.5 }
const flowGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const flowCardStyle: CSSProperties = { display: 'grid', gap: 7, padding: 15, borderRadius: 18, border: '1px solid #dbeafe', background: '#eff6ff', color: '#0f2747', fontWeight: 850 }
const splitStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }
const tableStyle: CSSProperties = { display: 'grid', gap: 8 }
const tableHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr 1fr .8fr .9fr', gap: 10, padding: '10px 12px', borderRadius: 14, background: '#0f2747', color: '#fff', fontSize: 12 }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr 1fr .8fr .9fr', gap: 10, alignItems: 'center', padding: '12px', borderRadius: 14, border: '1px solid #e5e7eb', background: '#fff', color: '#0f172a', fontSize: 13 }
const cardsListStyle: CSSProperties = { display: 'grid', gap: 10, maxHeight: 580, overflow: 'auto', paddingRight: 4 }
const rowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, border: '1px solid #e5e7eb', background: '#fff', alignItems: 'center' }
const goodRowStyle: CSSProperties = { ...rowStyle, borderColor: '#bbf7d0', background: '#f0fdf4' }
const dangerRowStyle: CSSProperties = { ...rowStyle, borderColor: '#fecaca', background: '#fff1f2' }
const emptyStyle: CSSProperties = { padding: 18, borderRadius: 16, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800, background: '#f8fafc' }
const codeStyle: CSSProperties = { margin: 0, whiteSpace: 'pre-wrap', background: '#0f2747', color: '#e0f2fe', padding: 20, borderRadius: 22, overflow: 'auto', fontSize: 13, lineHeight: 1.65 }
