
import type { CSSProperties, ReactNode } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAc360PolicyCenter } from '@/lib/ac360/policy-enforcement'

export const dynamic = 'force-dynamic'

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export default async function Ac360PolicyLockPage() {
  const result = await getAc360PolicyCenter()
  const policy = result.policy
  const locks = policy?.locks || []
  const events = policy?.events || []
  const overrides = policy?.overrides || []
  const coverage = policy?.coverage || []
  const decisions = policy?.decisions || []
  const blocked = decisions.filter((row: any) => !row.allowed).length
  const pendingOverrides = overrides.filter((row: any) => row.status === 'requested').length
  const missingCoverage = coverage.filter((row: any) => ['missing', 'expected'].includes(row.coverage_status) && row.enforcement_mode === 'strict').length

  return (
    <AppShell
      title="AngelCare 360 Policy Lock"
      subtitle="Phase 1E production policy enforcement: fail-closed safety, override governance, blocked-action UX, audit visibility and route coverage before Phase 2 school operations."
      breadcrumbs={[{ label: 'AngelCare 360' }, { label: 'Phase 1E Policy Lock' }]}
      actions={<><PageAction href="/angelcare-360/action-wiring" variant="light">Action Wiring</PageAction><PageAction href="/angelcare-360/guardrails" variant="light">Guardrails</PageAction><PageAction href="/api/ac360/policy-center" variant="light">Policy API</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>AC360-PH1E-PRODUCTION-POLICY-ENFORCEMENT</div>
            <h1 style={heroTitleStyle}>The billing foundation is now safety-locked for production behavior.</h1>
            <p style={heroTextStyle}>Phase 1E keeps the build strictly inside Phase 1. It does not create school modules yet. It makes the doctrine enforceable at policy level: unresolved organization, unknown action, inactive wiring, hard restrictions, missing credits, cancellation data-risk, and override exceptions are now visible, auditable and governed.</p>
          </div>
          <div style={statusCardStyle}>
            <span>Active organization</span>
            <strong>{result.context?.org?.display_name || 'Not resolved'}</strong>
            <small>{result.context?.subscription?.status || 'no subscription'} • {result.context?.wallet?.balance ?? '—'} credits</small>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Policy locks" value={locks.length} sub="fail-closed / override / data rules" />
          <Kpi label="Open events" value={events.filter((row: any) => row.status === 'open').length} sub="blocked UX + safety events" />
          <Kpi label="Pending overrides" value={pendingOverrides} sub="manual exception requests" />
          <Kpi label="Route coverage" value={`${coverage.length - missingCoverage}/${coverage.length || 0}`} sub="strict routes covered" />
          <Kpi label="Blocked guards" value={blocked} sub="recent AC360 blocks" />
          <Kpi label="Active restrictions" value={policy?.restrictions?.length || 0} sub="billing/governance locks" />
        </section>

        <Panel title="Phase 1E locked doctrine" subtitle="Every serious action must remain explainable, billable, restrictable, recoverable and auditable before it reaches the real executor.">
          <div style={flowGridStyle}>
            {(policy?.doctrine || []).map((step: string, index: number) => (
              <div key={step} style={flowCardStyle}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></div>
            ))}
          </div>
        </Panel>

        <section style={splitStyle}>
          <Panel title="Production policy locks" subtitle="These locks define which production risks must fail closed, require override, warn, or preserve data as read-only.">
            <div style={cardsListStyle}>
              {locks.map((lock: any) => (
                <div key={lock.lock_key} style={lock.severity === 'critical' ? dangerRowStyle : rowStyle}>
                  <div>
                    <b>{lock.title}</b>
                    <small>{lock.lock_key} • {lock.doctrine_step}</small>
                    <em>{lock.behavior} • {lock.failsafe_mode} • override {lock.override_allowed ? 'allowed' : 'not allowed'}</em>
                  </div>
                  <strong>{lock.severity}</strong>
                </div>
              ))}
              {!locks.length ? <Empty text="No policy locks loaded. Apply Phase 1E migration." /> : null}
            </div>
          </Panel>

          <Panel title="Blocked-action UX messages" subtitle="The blocked state is not a technical error; it is a client-facing governance state with next action and support clarity.">
            <div style={cardsListStyle}>
              {(policy?.blockedMessages || []).map((message: any) => (
                <div key={message.decision_key} style={message.severity === 'critical' ? dangerRowStyle : rowStyle}>
                  <div>
                    <b>{message.title}</b>
                    <small>{message.decision_key}</small>
                    <em>{message.primary_cta_label} → {message.primary_cta_href}</em>
                  </div>
                  <strong>{message.severity}</strong>
                </div>
              ))}
              {!(policy?.blockedMessages || []).length ? <Empty text="No blocked-action messages loaded." /> : null}
            </div>
          </Panel>
        </section>

        <section style={splitStyle}>
          <Panel title="Route coverage safety table" subtitle="Existing serious routes must stay covered before Phase 2 modules start adding student, parent, finance, attendance and communication actions.">
            <div style={coverageTableStyle}>
              <CoverageHeader />
              {coverage.map((row: any) => (
                <div key={`${row.http_method}:${row.route_path}`} style={coverageRowStyle}>
                  <div><b>{row.http_method} {row.route_path}</b><small>{row.target_module}</small></div>
                  <div>{row.expected_action_key || '—'}</div>
                  <strong style={row.coverage_status === 'covered' ? okPillStyle : warnPillStyle}>{row.coverage_status}</strong>
                  <div>{row.enforcement_mode}</div>
                </div>
              ))}
              {!coverage.length ? <Empty text="No route coverage rows loaded." /> : null}
            </div>
          </Panel>

          <Panel title="Override governance" subtitle="Overrides are not shortcuts. They are temporary, reason-based, expiring exceptions that remain audited.">
            <div style={cardsListStyle}>
              {overrides.slice(0, 40).map((override: any) => (
                <div key={override.id} style={override.status === 'approved' ? goodRowStyle : override.status === 'requested' ? warnRowStyle : rowStyle}>
                  <div>
                    <b>{override.action_key || 'general override'}</b>
                    <small>{override.status} • expires {override.expires_at ? new Date(override.expires_at).toLocaleString('fr-MA') : '—'}</small>
                    <em>{override.reason}</em>
                  </div>
                  <strong>{override.requested_behavior}</strong>
                </div>
              ))}
              {!overrides.length ? <Empty text="No override requests yet. Blocked actions can request controlled overrides." /> : null}
            </div>
          </Panel>
        </section>

        <section style={splitStyle}>
          <Panel title="Latest policy events" subtitle="Policy events connect blocked-action UX, restrictions, route warnings and override changes to a management-readable audit layer.">
            <div style={cardsListStyle}>
              {events.slice(0, 50).map((event: any) => (
                <div key={event.id} style={event.severity === 'critical' ? dangerRowStyle : event.severity === 'warning' ? warnRowStyle : rowStyle}>
                  <div>
                    <b>{event.event_key}</b>
                    <small>{event.action_key || 'no action'} • {new Date(event.created_at).toLocaleString('fr-MA')}</small>
                    <em>{event.message}</em>
                  </div>
                  <strong>{event.severity}</strong>
                </div>
              ))}
              {!events.length ? <Empty text="No policy events yet. Run reconciliation or trigger a blocked action." /> : null}
            </div>
          </Panel>

          <Panel title="Phase 1E automation rules" subtitle="The policy lock is governed by rules for fail-closed behavior, override control, route coverage and audit visibility.">
            <div style={cardsListStyle}>
              {(policy?.rules || []).map((rule: any) => (
                <div key={rule.rule_key} style={rowStyle}>
                  <div><b>{rule.label}</b><small>{rule.trigger_event}</small></div>
                  <strong>{rule.status}</strong>
                </div>
              ))}
              {!(policy?.rules || []).length ? <Empty text="No Phase 1E automation rules loaded." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="Strict Phase 1E server pattern" subtitle="From now until production deployment, serious endpoints should use Phase 1E policy safety before the executor. Phase 2 school actions will inherit this same chain.">
          <pre style={codeStyle}>{`const guarded = await runAc360WiredAction(
  'capital.tasks.create',
  async () => {
    // real write/send/upload/generate happens only here
    return await executeRealAction()
  },
  {
    orgId,
    quantity,
    idempotencyKey,
    metadata: { source: 'route-name' }
  }
)

if (!guarded.ok) return ac360GuardBlockedResponse(guarded)

// Phase 1E chain:
// policy safety → route/action wiring → guard → entitlement → restrictions → credits → usage → audit`}</pre>
        </Panel>

        {policy?.errors?.length ? (
          <section style={warningStyle}>
            <strong>Policy center loaded with warnings.</strong>
            <span>{policy.errors.join(' | ')}</span>
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

function CoverageHeader() {
  return <div style={coverageHeaderStyle}><b>Route</b><b>Action</b><b>Status</b><b>Mode</b></div>
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const pageStyle: CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 310px', gap: 22, alignItems: 'stretch', padding: 32, borderRadius: 34, background: 'linear-gradient(135deg,#0f2747,#0f4c81 55%,#1e3a8a)', color: '#fff', boxShadow: '0 30px 80px rgba(15,23,42,.20)' }
const badgeStyle: CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#dbeafe', fontSize: 12, fontWeight: 950, marginBottom: 14 }
const heroTitleStyle: CSSProperties = { margin: 0, fontSize: 38, lineHeight: 1.05, fontWeight: 950, letterSpacing: -0.8 }
const heroTextStyle: CSSProperties = { margin: '14px 0 0', color: '#dbeafe', fontWeight: 760, lineHeight: 1.55, maxWidth: 960 }
const statusCardStyle: CSSProperties = { display: 'grid', gap: 8, alignContent: 'center', padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.20)' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 45px rgba(15,23,42,.06)' }
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 28, padding: 22, boxShadow: '0 20px 55px rgba(15,23,42,.07)' }
const panelHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }
const sectionTitleStyle: CSSProperties = { margin: 0, color: '#0f2747', fontSize: 20, fontWeight: 950 }
const sectionTextStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 700, lineHeight: 1.5 }
const flowGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const flowCardStyle: CSSProperties = { display: 'grid', gap: 7, padding: 15, borderRadius: 18, border: '1px solid #dbeafe', background: '#eff6ff', color: '#0f2747', fontWeight: 850 }
const splitStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }
const cardsListStyle: CSSProperties = { display: 'grid', gap: 10, maxHeight: 620, overflow: 'auto', paddingRight: 4 }
const rowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, border: '1px solid #e5e7eb', background: '#fff', alignItems: 'center' }
const dangerRowStyle: CSSProperties = { ...rowStyle, borderColor: '#fecaca', background: '#fff1f2' }
const warnRowStyle: CSSProperties = { ...rowStyle, borderColor: '#fed7aa', background: '#fff7ed' }
const goodRowStyle: CSSProperties = { ...rowStyle, borderColor: '#bbf7d0', background: '#f0fdf4' }
const coverageTableStyle: CSSProperties = { display: 'grid', gap: 8 }
const coverageHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.8fr 1fr .55fr .45fr', gap: 10, padding: '10px 12px', borderRadius: 14, background: '#0f2747', color: '#fff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em' }
const coverageRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.8fr 1fr .55fr .45fr', gap: 10, alignItems: 'center', padding: 12, borderRadius: 14, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13 }
const okPillStyle: CSSProperties = { display: 'inline-flex', justifyContent: 'center', borderRadius: 999, padding: '5px 9px', color: '#166534', background: '#dcfce7', border: '1px solid #bbf7d0' }
const warnPillStyle: CSSProperties = { display: 'inline-flex', justifyContent: 'center', borderRadius: 999, padding: '5px 9px', color: '#9a3412', background: '#ffedd5', border: '1px solid #fed7aa' }
const emptyStyle: CSSProperties = { padding: 18, borderRadius: 16, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800, background: '#f8fafc' }
const codeStyle: CSSProperties = { margin: 0, whiteSpace: 'pre-wrap', background: '#0f2747', color: '#e0f2fe', padding: 20, borderRadius: 22, overflow: 'auto', fontSize: 13, lineHeight: 1.65 }
const warningStyle: CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 22, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontWeight: 800 }
