import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAc360BillingCenter } from '@/lib/ac360/runtime'
import { formatMAD } from '@/lib/ac360/constants'

export const dynamic = 'force-dynamic'

function pct(used: number, allowance: number) {
  if (!allowance) return '0%'
  return `${Math.max(0, Math.min(100, Math.round((used / allowance) * 100)))}%`
}

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export default async function Ac360BillingCenterPage() {
  const result = await getAc360BillingCenter()
  const context = result.context
  const billing = result.billing
  const org = context?.org
  const subscription = context?.subscription
  const wallet = context?.wallet
  const plan = subscription?.plan
  const currentUsageCredits = (billing?.usage || []).reduce((sum: number, row: any) => sum + n(row.credits_consumed), 0)
  const allowance = n(wallet?.monthly_included_allowance)

  return (
    <AppShell
      title="AngelCare 360 Billing Center"
      subtitle="Live runtime bridge for packages, add-ons, usage credits, invoices, restrictions and account governance."
      breadcrumbs={[{ label: 'AngelCare 360' }, { label: 'Billing Center' }]}
      actions={<><PageAction href="/angelcare-360/foundation" variant="light">Foundation</PageAction><PageAction href="/angelcare-360/guardrails" variant="light">Guardrails</PageAction><PageAction href="/api/ac360/billing-center" variant="light">API</PageAction></>}
    >
      <div style={pageStyle}>
        {!context ? (
          <section style={warningStyle}>
            <strong>AC360 runtime is not bootstrapped for this user yet.</strong>
            <span>Run POST <code>/api/ac360/bootstrap</code> once from an authenticated CEO / Super Admin session, then refresh this page.</span>
          </section>
        ) : null}

        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>AC360-PH1B-RUNTIME-BRIDGE</div>
            <h1 style={heroTitleStyle}>{org?.display_name || 'AngelCare 360 Runtime'}</h1>
            <p style={heroTextStyle}>This page proves the Phase 1 foundation is now alive: the current institution has a subscription, plan, credit wallet, add-on menu, invoices, usage meters, restrictions and recommendation loop.</p>
          </div>
          <div style={statusCardStyle}>
            <span>Current package</span>
            <strong>{plan?.commercial_name || 'Not connected'}</strong>
            <small>{subscription?.status || 'no subscription'} • {subscription?.billing_interval || '—'}</small>
            <b>{formatMAD(plan?.public_monthly_price_mad || 0)}/mois</b>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Organization" value={org?.org_code || '—'} sub={org?.city || 'No city'} />
          <Kpi label="Subscription" value={subscription?.status || '—'} sub={subscription?.subscription_code || 'No subscription'} />
          <Kpi label="Wallet balance" value={`${n(wallet?.balance)} cr.`} sub={`${allowance} included credits`} />
          <Kpi label="Active add-ons" value={billing?.activeAddonKeys?.length || 0} sub="Growth Menu modules" />
          <Kpi label="Open restrictions" value={context?.restrictions?.length || 0} sub="payment / usage / access" />
          <Kpi label="Open recommendations" value={context?.recommendations?.length || 0} sub="upsell / top-up / Sérénité" />
        </section>

        <section style={splitStyle}>
          <Panel title="Credit wallet & usage pressure" subtitle="Credits are deducted by the usage engine. Low balance creates recommendations; exhausted balance creates top-up restrictions.">
            <div style={walletBoxStyle}>
              <div style={walletTopStyle}><strong>{n(wallet?.balance)} credits left</strong><span>{currentUsageCredits} credits consumed this period</span></div>
              <div style={progressStyle}><div style={{ ...barStyle, width: pct(currentUsageCredits, allowance) }} /></div>
              <small>{pct(currentUsageCredits, allowance)} of monthly allowance used.</small>
            </div>
            <div style={cardsListStyle}>
              {(billing?.meters || []).slice(0, 10).map((meter: any) => (
                <div key={meter.meter_key} style={rowStyle}>
                  <div><b>{meter.label}</b><small>{meter.category} • {meter.unit_label}</small></div>
                  <strong>{meter.default_credit_cost} cr.</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Active subscription items" subtitle="Base plan, add-ons, Sérénité bundles, services and usage packs are all line items — this is the real monetization structure.">
            <div style={cardsListStyle}>
              {(billing?.items || []).map((item: any) => (
                <div key={item.id} style={rowStyle}>
                  <div><b>{item.label}</b><small>{item.item_type} • {item.status}</small></div>
                  <strong>{formatMAD(n(item.unit_price_mad))}</strong>
                </div>
              ))}
              {!(billing?.items || []).length ? <Empty text="No subscription items yet." /> : null}
            </div>
          </Panel>
        </section>

        <section style={splitStyle}>
          <Panel title="Growth Menu add-ons" subtitle="Menu modules are client-controlled: activate, cancel, preserve data, and turn features read-only after cancellation.">
            <div style={cardsListStyle}>
              {(billing?.addons || []).slice(0, 18).map((addon: any) => {
                const active = billing?.activeAddonKeys?.includes(addon.addon_key)
                return (
                  <div key={addon.addon_key} style={active ? activeAddonStyle : rowStyle}>
                    <div><b>{addon.label}</b><small>{addon.family} • {addon.billing_model}</small></div>
                    <strong>{active ? 'ACTIVE' : formatMAD(n(addon.monthly_price_mad))}</strong>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Restrictions & recommendations" subtitle="This is the governance loop: account state, payment risks, low credits and limits become clear operational signals.">
            <div style={cardsListStyle}>
              {(context?.restrictions || []).map((restriction: any) => (
                <div key={restriction.id} style={dangerRowStyle}>
                  <div><b>{restriction.restriction_key}</b><small>{restriction.behavior} • {restriction.severity}</small></div>
                  <span>{restriction.status}</span>
                </div>
              ))}
              {(context?.recommendations || []).map((rec: any) => (
                <div key={rec.id} style={recommendationStyle}>
                  <div><b>{rec.title}</b><small>{rec.priority}</small></div>
                  <span>{rec.recommended_addon_key || rec.recommended_bundle_key || rec.recommended_plan_key || 'review'}</span>
                </div>
              ))}
              {!(context?.restrictions || []).length && !(context?.recommendations || []).length ? <Empty text="No active restrictions or recommendations." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="Invoices" subtitle="Invoices are generated from the active subscription items and usage summaries for the selected monthly period.">
          <div style={invoiceGridStyle}>
            {(billing?.invoices || []).map((invoice: any) => (
              <div key={invoice.id} style={invoiceStyle}>
                <span>{invoice.invoice_number}</span>
                <b>{formatMAD(n(invoice.total_mad))}</b>
                <small>{invoice.status} • due {invoice.due_date || '—'}</small>
              </div>
            ))}
            {!(billing?.invoices || []).length ? <Empty text="No invoices generated yet. Use POST /api/ac360/invoices/generate once the org is bootstrapped." /> : null}
          </div>
        </Panel>
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

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 22, alignItems: 'stretch', padding: 32, borderRadius: 34, background: 'linear-gradient(135deg,#0f2747,#0f4c81 55%,#166534)', color: '#fff', boxShadow: '0 30px 80px rgba(15,23,42,.20)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#dbeafe', fontSize: 12, fontWeight: 950, marginBottom: 14 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, lineHeight: 1.05, fontWeight: 950, letterSpacing: -0.8 }
const heroTextStyle: React.CSSProperties = { margin: '14px 0 0', color: '#dbeafe', fontWeight: 760, lineHeight: 1.55, maxWidth: 920 }
const statusCardStyle: React.CSSProperties = { display: 'grid', gap: 8, alignContent: 'center', padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.20)' }
const warningStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 22, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontWeight: 800 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const splitStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', color: '#0f172a' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 720, lineHeight: 1.45 }
const cardsListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, border: '1px solid #e2e8f0', borderRadius: 18, background: '#f8fafc' }
const activeAddonStyle: React.CSSProperties = { ...rowStyle, background: '#ecfdf5', borderColor: '#86efac' }
const dangerRowStyle: React.CSSProperties = { ...rowStyle, borderColor: '#fecaca', background: '#fff7f7' }
const recommendationStyle: React.CSSProperties = { ...rowStyle, borderColor: '#bfdbfe', background: '#eff6ff' }
const walletBoxStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 16, borderRadius: 20, background: '#f8fafc', border: '1px solid #dbe3ee', marginBottom: 14 }
const walletTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14 }
const progressStyle: React.CSSProperties = { height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }
const barStyle: React.CSSProperties = { height: '100%', background: '#22c55e', borderRadius: 999 }
const invoiceGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const invoiceStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 18, border: '1px solid #dbe3ee', background: '#f8fafc' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
