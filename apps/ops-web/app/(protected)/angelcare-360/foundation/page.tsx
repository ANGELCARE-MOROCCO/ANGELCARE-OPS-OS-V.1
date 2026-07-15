import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { computeAc360Readiness, getAc360FoundationSnapshot } from '@/lib/ac360/foundation'
import { AC360_CRITICAL_FLOW, AC360_FULL_ENGINE_COUNT, AC360_PACKAGE_PRICES_MAD, AC360_PHASE1_ENGINE_COUNT, formatMAD, isPhase1Engine } from '@/lib/ac360/constants'

export const dynamic = 'force-dynamic'

function percent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

export default async function AngelCare360FoundationPage() {
  const snapshot = await getAc360FoundationSnapshot()
  const readiness = computeAc360Readiness(snapshot)
  const phase1Engines = snapshot.engines.filter(isPhase1Engine)
  const futureEngines = snapshot.engines.filter((engine) => !isPhase1Engine(engine))
  const implemented = snapshot.engines.filter((engine) => engine.implementation_status === 'implemented').length
  const groupedFeatures = snapshot.features.reduce<Record<string, typeof snapshot.features>>((acc, feature) => {
    const key = feature.module_key || 'other'
    acc[key] = acc[key] || []
    acc[key].push(feature)
    return acc
  }, {})

  return (
    <AppShell
      title="AngelCare 360 Foundation"
      subtitle="Phase 1 production backbone: tenant, billing, entitlements, usage, restrictions, audit and account lifecycle."
      breadcrumbs={[{ label: 'AngelCare 360' }, { label: 'Phase 1 Foundation' }]}
      actions={<><PageAction href="/angelcare-360/billing-center" variant="light">Billing Center</PageAction><PageAction href="/angelcare-360/guardrails" variant="light">Guardrails</PageAction><PageAction href="/api/ac360/foundation" variant="light">API Snapshot</PageAction><PageAction href="/api/ac360/bootstrap" variant="light">Bootstrap API</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>AC360-PH1-FOUNDATION-2026-06-30</div>
            <h1 style={heroTitleStyle}>The monetization and governance backbone for a national school SaaS operating system.</h1>
            <p style={heroTextStyle}>Every serious action now has a place to check organization status, subscription, entitlements, capacity, credits, restrictions, usage, recommendations and audit logs before it becomes alive in production.</p>
          </div>
          <div style={scoreCardStyle}>
            <span>Foundation readiness</span>
            <strong>{readiness.score}/100</strong>
            <div style={progressStyle}><div style={{ ...barStyle, width: percent(readiness.score) }} /></div>
            <small>{snapshot.migrated ? 'Migration detected' : 'Run the Phase 1 migration'}</small>
          </div>
        </section>

        {!snapshot.migrated ? (
          <section style={warningStyle}>
            <strong>Migration required before live data appears.</strong>
            <span>Apply <code>supabase/migrations/20260630_ac360_phase1_foundation.sql</code>, then refresh this page. Missing tables: {snapshot.missingTables.slice(0, 8).join(', ')}{snapshot.missingTables.length > 8 ? '…' : ''}</span>
          </section>
        ) : null}

        <section style={kpiGridStyle}>
          <Kpi label="Master engines" value={`${snapshot.engines.length || 0}/${AC360_FULL_ENGINE_COUNT}`} sub={`${implemented} implemented`} />
          <Kpi label="Phase 1 engines" value={`${phase1Engines.length}/${AC360_PHASE1_ENGINE_COUNT}`} sub="foundation backbone" />
          <Kpi label="Packages" value={snapshot.plans.length} sub="Start / Pro / Command" />
          <Kpi label="Features" value={snapshot.features.length} sub="registry keys" />
          <Kpi label="Add-ons" value={snapshot.addons.length} sub="Growth Menu" />
          <Kpi label="Meters" value={snapshot.meters.length} sub="credits + usage" />
        </section>

        <section style={grid3Style}>
          {Object.entries(AC360_PACKAGE_PRICES_MAD).map(([key, value]) => (
            <div key={key} style={packageCardStyle}>
              <div style={packageTopStyle}><span>360 {key.toUpperCase()}</span><b>{formatMAD(value.monthly)}/mois</b></div>
              <h2 style={packageTitleStyle}>{key === 'start' ? 'Digitize basics' : key === 'pro' ? 'Manage operations' : 'Control and scale'}</h2>
              <div style={miniGridStyle}>
                <small>{value.students} students</small>
                <small>{value.staff} staff</small>
                <small>{value.campuses} campus</small>
                <small>{value.storageGb} GB</small>
                <small>{value.credits} credits</small>
                <small>{formatMAD(value.annual)}/year</small>
              </div>
            </div>
          ))}
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Critical action flow</h2>
              <p style={sectionTextStyle}>This is the strict sequence every production button should follow before executing billable or governed actions.</p>
            </div>
            <span style={pillStyle}>10-step gate</span>
          </div>
          <div style={flowGridStyle}>
            {AC360_CRITICAL_FLOW.map((item, index) => <div key={item} style={flowCardStyle}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>)}
          </div>
        </section>

        <section style={splitStyle}>
          <Panel title="Phase 1 engines implemented" subtitle="ENG-01 to ENG-44 are the real foundation scope. ENG-45 to ENG-52 are prepared for Phase 2 operations.">
            <div style={engineListStyle}>
              {phase1Engines.slice(0, 44).map((engine) => <EngineRow key={engine.engine_code} engine={engine} />)}
              {!phase1Engines.length ? <Empty text="No engine seed found yet. Apply the SQL migration." /> : null}
            </div>
          </Panel>

          <Panel title="Future operations engines prepared" subtitle="The 52-engine map remains visible so Phase 2 does not drift away from the national system architecture.">
            <div style={engineListStyle}>
              {futureEngines.map((engine) => <EngineRow key={engine.engine_code} engine={engine} />)}
              {!futureEngines.length ? <Empty text="Future engine map will appear after migration." /> : null}
            </div>
          </Panel>
        </section>

        <section style={splitStyle}>
          <Panel title="Growth Menu add-ons" subtitle="Menu-based modules: freely activatable/cancellable, with data preserved and access read-only after cancellation.">
            <div style={cardsListStyle}>
              {snapshot.addons.slice(0, 24).map((addon) => (
                <div key={addon.addon_key} style={addonStyle}>
                  <div><b>{addon.label}</b><small>{addon.family} • {addon.billing_model}</small></div>
                  <strong>{addon.billing_model === 'enterprise_quote' ? 'Quote' : `${formatMAD(addon.monthly_price_mad)}/mo`}</strong>
                </div>
              ))}
              {!snapshot.addons.length ? <Empty text="Add-on catalog will appear after migration." /> : null}
            </div>
          </Panel>

          <Panel title="Usage meters & credits" subtitle="The usage economy protects margin for WhatsApp, SMS, AI, reports, storage and automations.">
            <div style={cardsListStyle}>
              {snapshot.meters.map((meter) => (
                <div key={meter.meter_key} style={addonStyle}>
                  <div><b>{meter.label}</b><small>{meter.category} • {meter.unit_label}</small></div>
                  <strong>{meter.default_credit_cost} cr.</strong>
                </div>
              ))}
              {!snapshot.meters.length ? <Empty text="Usage meters will appear after migration." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="Feature registry by module" subtitle="The UI should never hardcode access. It should ask the entitlement engine if an organization can use each feature/action.">
          <div style={featureGroupGridStyle}>
            {Object.entries(groupedFeatures).map(([moduleKey, features]) => (
              <div key={moduleKey} style={featureGroupStyle}>
                <h3>{moduleKey}</h3>
                <div style={featureListStyle}>{features.slice(0, 10).map((feature) => <span key={feature.feature_key}>{feature.label}</span>)}</div>
              </div>
            ))}
            {!snapshot.features.length ? <Empty text="Feature registry will appear after migration." /> : null}
          </div>
        </Panel>

        <section style={splitStyle}>
          <Panel title="Active restrictions" subtitle="Unpaid invoices, exhausted credits, reached limits and cancelled add-ons create account governance rules.">
            <div style={cardsListStyle}>
              {snapshot.restrictions.map((restriction) => (
                <div key={restriction.id} style={restrictionStyle}>
                  <div><b>{restriction.restriction_key}</b><small>{restriction.behavior} • {restriction.severity}</small></div>
                  <span>{restriction.status}</span>
                </div>
              ))}
              {!snapshot.restrictions.length ? <Empty text="No active restrictions yet." /> : null}
            </div>
          </Panel>

          <Panel title="Automation rules" subtitle="The first rules convert usage/payment/limit events into warnings, blocks, upgrade suggestions and data-preserving cancellations.">
            <div style={cardsListStyle}>
              {snapshot.rules.map((rule) => (
                <div key={rule.rule_key} style={ruleStyle}>
                  <div><b>{rule.label}</b><small>{rule.system_group}</small></div>
                  <span>{rule.status}</span>
                </div>
              ))}
              {!snapshot.rules.length ? <Empty text="Automation rules will appear after migration." /> : null}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section style={panelStyle}><div style={panelHeaderStyle}><div><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div></div>{children}</section>
}

function EngineRow({ engine }: { engine: any }) {
  return <div style={engineRowStyle}><div><b>{engine.engine_code}</b><span>{engine.engine_name}</span></div><small>{engine.implementation_status}</small></div>
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 22, alignItems: 'stretch', padding: 32, borderRadius: 34, background: 'linear-gradient(135deg,#0f2747,#082f49 55%,#064e3b)', color: '#fff', boxShadow: '0 30px 80px rgba(15,23,42,.22)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#dbeafe', fontSize: 12, fontWeight: 950, marginBottom: 14 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, lineHeight: 1.05, fontWeight: 950, letterSpacing: -0.8, maxWidth: 1000 }
const heroTextStyle: React.CSSProperties = { margin: '14px 0 0', color: '#dbeafe', fontWeight: 760, lineHeight: 1.55, maxWidth: 920 }
const scoreCardStyle: React.CSSProperties = { display: 'grid', gap: 10, alignContent: 'center', padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.20)' }
const progressStyle: React.CSSProperties = { height: 10, background: 'rgba(255,255,255,.20)', borderRadius: 999, overflow: 'hidden' }
const barStyle: React.CSSProperties = { height: '100%', background: '#22c55e', borderRadius: 999 }
const warningStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 22, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontWeight: 800 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const grid3Style: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16 }
const packageCardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const packageTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, color: '#0f2747', fontWeight: 950 }
const packageTitleStyle: React.CSSProperties = { margin: '14px 0', fontSize: 24, color: '#0f172a', fontWeight: 950 }
const miniGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', color: '#0f172a' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 720, lineHeight: 1.45 }
const pillStyle: React.CSSProperties = { border: '1px solid #bfdbfe', color: '#1d4ed8', background: '#eff6ff', padding: '8px 12px', borderRadius: 999, fontWeight: 950, whiteSpace: 'nowrap' }
const flowGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }
const flowCardStyle: React.CSSProperties = { border: '1px solid #dbe3ee', background: '#f8fafc', borderRadius: 18, padding: 14, display: 'grid', gap: 8 }
const splitStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const engineListStyle: React.CSSProperties = { display: 'grid', gap: 8, maxHeight: 520, overflow: 'auto', paddingRight: 4 }
const engineRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 16, background: '#f8fafc' }
const cardsListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const addonStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, border: '1px solid #e2e8f0', borderRadius: 18, background: '#f8fafc' }
const restrictionStyle: React.CSSProperties = { ...addonStyle, borderColor: '#fecaca', background: '#fff7f7' }
const ruleStyle: React.CSSProperties = { ...addonStyle, borderColor: '#bfdbfe', background: '#eff6ff' }
const featureGroupGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const featureGroupStyle: React.CSSProperties = { border: '1px solid #dbe3ee', background: '#f8fafc', borderRadius: 20, padding: 16 }
const featureListStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
