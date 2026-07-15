import type { CSSProperties, ReactNode } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAc360ActionWiringCenter } from '@/lib/ac360/action-wiring'

export const dynamic = 'force-dynamic'

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export default async function Ac360ActionWiringPage() {
  const result = await getAc360ActionWiringCenter()
  const rows = result.wiring?.rows || []
  const decisions = result.wiring?.decisions || []
  const allowed = decisions.filter((row: any) => row.allowed).length
  const blocked = decisions.filter((row: any) => !row.allowed).length

  return (
    <AppShell
      title="AngelCare 360 Action Wiring"
      subtitle="Phase 1D real app action wiring: existing production APIs are now bridged to the AC360 guard, entitlement, credits, restriction and audit chain."
      breadcrumbs={[{ label: 'AngelCare 360' }, { label: 'Phase 1D Action Wiring' }]}
      actions={<><PageAction href="/angelcare-360/guardrails" variant="light">Guardrails</PageAction><PageAction href="/angelcare-360/billing-center" variant="light">Billing Center</PageAction><PageAction href="/api/ac360/action-wiring" variant="light">Wiring API</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>AC360-PH1D-REAL-APP-ACTION-WIRING</div>
            <h1 style={heroTitleStyle}>The guard is now connected to real app actions.</h1>
            <p style={heroTextStyle}>Phase 1D keeps us strictly inside the foundation plan. It does not build school modules yet; it connects serious existing actions to the production doctrine: check organization, subscription, entitlement, restriction, capacity/credits, execute only when allowed, record usage, then audit.</p>
          </div>
          <div style={statusCardStyle}>
            <span>Active organization</span>
            <strong>{result.context?.org?.display_name || 'Not resolved'}</strong>
            <small>{result.context?.subscription?.status || 'no subscription'} • {result.context?.wallet?.balance ?? '—'} credits</small>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Wired routes" value={rows.length || result.wiring?.static?.length || 0} sub="real app route/action bridges" />
          <Kpi label="Strict mode" value={(rows || []).filter((row: any) => row.enforcement_mode === 'strict').length || result.wiring?.static?.length || 0} sub="block before executor" />
          <Kpi label="Allowed" value={allowed} sub="recent wired decisions" />
          <Kpi label="Blocked" value={blocked} sub="top-up / upgrade / restriction" />
          <Kpi label="Rules" value={result.wiring?.rules?.length || 0} sub="Phase 1D automation rules" />
        </section>

        <Panel title="Real app action wiring matrix" subtitle="These are not theoretical features; these are concrete routes that now have AC360 guard contracts.">
          <div style={tableStyle}>
            <Header cols={["Wiring", "Route", "Action", "Mode"]} />
            {(rows.length ? rows : result.wiring?.static || []).map((row: any) => (
              <Row key={row.wiring_key || row.wiringKey} cols={[
                <div key="w"><b>{row.wiring_key || row.wiringKey}</b><small>{row.target_module || row.targetModule || 'module'}</small></div>,
                `${row.http_method || row.method || 'POST'} ${row.route_path || row.routePath}`,
                <div key="a"><b>{row.action_key || row.actionKey}</b><small>{row.quantity_strategy || row.quantityStrategy || 'fixed_1'}</small></div>,
                row.enforcement_mode || row.enforcementMode || 'strict',
              ]} />
            ))}
            {!rows.length && !(result.wiring?.static || []).length ? <Empty text="No action wiring loaded. Apply Phase 1D migration." /> : null}
          </div>
        </Panel>

        <section style={splitStyle}>
          <Panel title="Latest wired guard decisions" subtitle="Each real app action now leaves a guard decision and audit trace before or after executor success.">
            <div style={cardsListStyle}>
              {decisions.slice(0, 30).map((decision: any) => (
                <div key={decision.id} style={decision.allowed ? goodRowStyle : dangerRowStyle}>
                  <div><b>{decision.action_key}</b><small>{decision.guard_stage} • {decision.meter_key || 'no meter'} • {new Date(decision.created_at).toLocaleString('fr-MA')}</small></div>
                  <strong>{decision.allowed ? 'ALLOWED' : decision.decision}</strong>
                </div>
              ))}
              {!decisions.length ? <Empty text="No wired action decisions yet. Use a wired route or POST /api/ac360/action-wiring/preflight." /> : null}
            </div>
          </Panel>

          <Panel title="Phase 1D rules" subtitle="The real app wiring rules prevent serious actions from bypassing billing governance.">
            <div style={cardsListStyle}>
              {(result.wiring?.rules || []).map((rule: any) => (
                <div key={rule.rule_key} style={rowStyle}>
                  <div><b>{rule.label}</b><small>{rule.trigger_event}</small></div>
                  <strong>{rule.status}</strong>
                </div>
              ))}
              {!(result.wiring?.rules || []).length ? <Empty text="No Phase 1D automation rules loaded yet." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="Server route wiring pattern" subtitle="Use this for every next serious endpoint until production deployment.">
          <pre style={codeStyle}>{`const guarded = await runAc360WiredAction(
  'email_os.compose_send',
  async () => {
    // real write/send/upload/generate happens only here
    return await executeRealAction()
  },
  {
    quantity,
    idempotencyKey,
    metadata: { source: 'route-name' }
  }
)

if (!guarded.ok) return ac360GuardBlockedResponse(guarded)`}</pre>
        </Panel>

        {result.wiring?.errors?.length ? (
          <section style={warningStyle}>
            <strong>Action wiring loaded with warnings.</strong>
            <span>{result.wiring.errors.join(' | ')}</span>
          </section>
        ) : null}
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

function Header({ cols }: { cols: string[] }) {
  return <div style={{ ...gridRowStyle, ...headerRowStyle }}>{cols.map((col) => <b key={col}>{col}</b>)}</div>
}

function Row({ cols }: { cols: ReactNode[] }) {
  return <div style={gridRowStyle}>{cols.map((col, i) => <div key={i}>{col}</div>)}</div>
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const pageStyle: CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 18, alignItems: 'stretch' }
const badgeStyle: CSSProperties = { display: 'inline-block', padding: '7px 10px', borderRadius: 999, background: '#eaf2ff', color: '#0b3b78', fontSize: 11, fontWeight: 900, letterSpacing: '.08em' }
const heroTitleStyle: CSSProperties = { margin: '12px 0 8px', fontSize: 32, lineHeight: 1.05, color: '#0f172a', letterSpacing: '-0.04em' }
const heroTextStyle: CSSProperties = { margin: 0, color: '#475569', lineHeight: 1.7, maxWidth: 900 }
const statusCardStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 22, padding: 18, background: 'linear-gradient(180deg,#ffffff,#eff6ff)', display: 'grid', gap: 8, alignContent: 'center', boxShadow: '0 16px 40px rgba(15,23,42,.08)' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const kpiStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, background: '#fff', display: 'grid', gap: 6, boxShadow: '0 10px 25px rgba(15,23,42,.05)' }
const panelStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 22, background: '#fff', padding: 18, boxShadow: '0 14px 35px rgba(15,23,42,.06)' }
const panelHeadStyle: CSSProperties = { marginBottom: 12 }
const tableStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }
const gridRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.2fr .6fr', gap: 12, padding: '12px 14px', borderTop: '1px solid #e2e8f0', alignItems: 'center', fontSize: 13 }
const headerRowStyle: CSSProperties = { background: '#0f3767', color: '#fff', borderTop: 0, fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase' }
const splitStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const cardsListStyle: CSSProperties = { display: 'grid', gap: 10 }
const rowStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, background: '#f8fafc' }
const goodRowStyle: CSSProperties = { ...rowStyle, borderColor: '#bbf7d0', background: '#f0fdf4' }
const dangerRowStyle: CSSProperties = { ...rowStyle, borderColor: '#fecaca', background: '#fff1f2' }
const emptyStyle: CSSProperties = { padding: 16, color: '#64748b', background: '#f8fafc' }
const codeStyle: CSSProperties = { whiteSpace: 'pre-wrap', margin: 0, background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 16, fontSize: 12, lineHeight: 1.7 }
const warningStyle: CSSProperties = { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', borderRadius: 16, padding: 14, display: 'grid', gap: 4 }
