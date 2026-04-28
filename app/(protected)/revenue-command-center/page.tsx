import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type Row = Record<string, any>

type RevenueSignal = {
  level: 'critical' | 'warning' | 'opportunity' | 'healthy'
  title: string
  message: string
  action: string
}

const MAD = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  maximumFractionDigits: 0,
})

export default async function RevenueCommandCenterPage() {
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()

  const [leads, contracts, invoices, missions, families, caregivers, incidents] = await Promise.all([
    loadTable(supabase, 'leads'),
    loadTable(supabase, 'contracts'),
    loadTable(supabase, 'billing_invoices'),
    loadTable(supabase, 'missions'),
    loadTable(supabase, 'families'),
    loadTable(supabase, 'caregivers'),
    loadTable(supabase, 'incidents'),
  ])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const visibleLeads = leads.filter((lead) => !boolish(lead.is_archived) && !boolish(lead.archived))
  const convertedLeads = visibleLeads.filter(isConvertedLead)
  const hotLeads = visibleLeads.filter((lead) => includesAny(textOf(lead.priority, lead.temperature, lead.score, lead.stage, lead.status), ['hot', 'urgent', 'chaud', 'priority', 'high']))
  const overdueFollowups = visibleLeads.filter((lead) => {
    const d = dateOf(lead.next_action_date || lead.next_follow_up_at || lead.follow_up_date || lead.callback_at)
    return d ? d < now && !isConvertedLead(lead) : false
  })

  const activeContracts = contracts.filter((contract) => !boolish(contract.is_archived) && includesAny(textOf(contract.status, contract.contract_status), ['active', 'signed', 'valid', 'actif']))
  const expiringContracts = activeContracts.filter((contract) => {
    const d = dateOf(contract.end_date || contract.expires_at || contract.renewal_date || contract.next_renewal_at)
    if (!d) return false
    const days = daysBetween(now, d)
    return days >= 0 && days <= 30
  })

  const paidInvoices = invoices.filter(isPaidInvoice)
  const paidToday = paidInvoices.filter((invoice) => isSameOrAfter(invoiceDate(invoice), todayStart))
  const paidMonth = paidInvoices.filter((invoice) => isSameOrAfter(invoiceDate(invoice), monthStart))
  const unpaidInvoices = invoices.filter((invoice) => !isPaidInvoice(invoice) && !boolish(invoice.is_archived))
  const overdueInvoices = unpaidInvoices.filter((invoice) => {
    const due = dateOf(invoice.due_date || invoice.payment_due_date || invoice.deadline_at)
    return due ? due < todayStart : includesAny(textOf(invoice.status), ['overdue', 'late', 'unpaid'])
  })

  const revenueToday = sumMoney(paidToday)
  const revenueMTD = sumMoney(paidMonth)
  const unpaidRisk = sumMoney(unpaidInvoices)
  const overdueRisk = sumMoney(overdueInvoices)
  const activeContractValue = sumMoney(activeContracts)
  const pipelineValue = sumMoney(visibleLeads)
  const forecast = activeContractValue + pipelineValue * 0.35
  const target = 800000
  const targetProgress = Math.min(100, Math.round((revenueMTD / target) * 100))

  const activeMissions = missions.filter((mission) => !boolish(mission.is_archived) && includesAny(textOf(mission.status, mission.mission_status), ['active', 'planned', 'scheduled', 'confirmed', 'ongoing', 'en cours']))
  const completedMissions = missions.filter((mission) => includesAny(textOf(mission.status, mission.mission_status), ['completed', 'done', 'finished', 'terminée', 'terminee']))
  const cancelledMissions = missions.filter((mission) => includesAny(textOf(mission.status, mission.mission_status), ['cancelled', 'canceled', 'lost', 'annulée', 'annulee']))
  const availableCaregivers = caregivers.filter((caregiver) => includesAny(textOf(caregiver.status, caregiver.availability_status, caregiver.availability), ['available', 'active', 'disponible', 'ready']))
  const openIncidents = incidents.filter((incident) => !boolish(incident.is_archived) && !includesAny(textOf(incident.status), ['closed', 'resolved', 'done', 'fermé', 'ferme']))

  const conversionRate = visibleLeads.length ? Math.round((convertedLeads.length / visibleLeads.length) * 100) : 0
  const deliveryHealth = missions.length ? Math.round((completedMissions.length / Math.max(1, completedMissions.length + cancelledMissions.length)) * 100) : 100
  const supplyRatio = activeMissions.length ? Math.round((availableCaregivers.length / activeMissions.length) * 100) : availableCaregivers.length ? 100 : 0
  const riskScore = computeRiskScore({ overdueRisk, unpaidRisk, openIncidents: openIncidents.length, overdueFollowups: overdueFollowups.length, supplyRatio })
  const signals = buildSignals({ revenueMTD, target, overdueRisk, unpaidRisk, visibleLeads, hotLeads, overdueFollowups, conversionRate, activeContracts, expiringContracts, activeMissions, availableCaregivers, supplyRatio, openIncidents, deliveryHealth })

  return (
    <AppShell
      title="Revenue Command Center"
      subtitle="CEO real engine • pipeline, contracts, billing, missions, capacity and risk intelligence."
      breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Command Center' }]}
      actions={
        <>
          <PageAction href="/leads/command-center" variant="light">Leads Command</PageAction>
          <PageAction href="/billing/overview" variant="light">Billing</PageAction>
          <PageAction href="/contracts/command-center">Contracts</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div style={heroGlowStyle} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={badgeStyle}>⚡ CEO REVENUE ENGINE</div>
            <h1 style={heroTitleStyle}>Revenue Control Tower</h1>
            <p style={heroTextStyle}>One cockpit connecting acquisition, delivery, cash, capacity and risk.</p>
            <div style={heroMetaStyle}>
              <span>Target MTD: {MAD.format(target)}</span>
              <span>Progress: {targetProgress}%</span>
              <span>Risk score: {riskScore}/100</span>
            </div>
          </div>
          <div style={pulseCardStyle}>
            <span>Revenue MTD</span>
            <strong>{MAD.format(revenueMTD)}</strong>
            <div style={progressTrackStyle}><div style={{ ...progressFillStyle, width: `${targetProgress}%` }} /></div>
            <small>{targetProgress}% of monthly target</small>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi title="Revenue today" value={MAD.format(revenueToday)} sub="paid invoices today" tone="#22c55e" />
          <Kpi title="Revenue MTD" value={MAD.format(revenueMTD)} sub="paid invoices this month" tone="#2563eb" />
          <Kpi title="Forecast" value={MAD.format(forecast)} sub="contracts + weighted pipeline" tone="#8b5cf6" />
          <Kpi title="Unpaid risk" value={MAD.format(unpaidRisk)} sub={`${overdueInvoices.length} overdue invoices`} tone="#ef4444" />
          <Kpi title="Pipeline" value={String(visibleLeads.length)} sub={`${hotLeads.length} hot / ${overdueFollowups.length} overdue follow-ups`} tone="#f59e0b" />
          <Kpi title="Delivery health" value={`${deliveryHealth}%`} sub={`${activeMissions.length} active missions`} tone="#14b8a6" />
        </section>

        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="CEO Signal Engine" subtitle="Automatic diagnosis based on revenue, pipeline, contracts, operations and risk." />
            <div style={signalsGridStyle}>
              {signals.map((signal) => <Signal key={signal.title} signal={signal} />)}
            </div>
          </div>
          <aside style={sidePanelStyle}>
            <Header title="Executive Brain" subtitle="What leadership should enforce now." />
            <ExecutiveAction index="01" title="Cash discipline" value={overdueRisk > 0 ? `Recover ${MAD.format(overdueRisk)} overdue immediately.` : 'No overdue cash pressure detected.'} />
            <ExecutiveAction index="02" title="Lead pressure" value={overdueFollowups.length ? `${overdueFollowups.length} leads require follow-up today.` : 'Follow-up pressure is controlled.'} />
            <ExecutiveAction index="03" title="Capacity risk" value={supplyRatio < 70 ? 'Caregiver supply is below mission pressure.' : 'Capacity level is acceptable.'} />
            <ExecutiveAction index="04" title="Operational trust" value={openIncidents.length ? `${openIncidents.length} open incidents require control.` : 'No open incident pressure.'} />
          </aside>
        </section>

        <section style={engineGridStyle}>
          <EngineCard title="Acquisition Engine" label="Leads" value={visibleLeads.length} detail={`${conversionRate}% conversion • ${hotLeads.length} hot`} href="/leads/command-center" tone="#60a5fa" />
          <EngineCard title="Contract Engine" label="Contracts" value={activeContracts.length} detail={`${expiringContracts.length} expiring soon • ${MAD.format(activeContractValue)}`} href="/contracts/command-center" tone="#a78bfa" />
          <EngineCard title="Cash Engine" label="Billing" value={MAD.format(revenueMTD)} detail={`${MAD.format(unpaidRisk)} unpaid risk`} href="/billing/overview" tone="#34d399" />
          <EngineCard title="Execution Engine" label="Missions" value={activeMissions.length} detail={`${completedMissions.length} completed • ${cancelledMissions.length} cancelled`} href="/missions/command-center" tone="#fbbf24" />
          <EngineCard title="Capacity Engine" label="Caregivers" value={availableCaregivers.length} detail={`${supplyRatio}% supply ratio`} href="/caregivers/workforce" tone="#2dd4bf" />
          <EngineCard title="Risk Engine" label="Quality" value={openIncidents.length} detail="open incidents" href="/incidents" tone="#fb7185" />
        </section>

        <section style={panelStyle}>
          <Header title="Revenue Machine Matrix" subtitle="Module-by-module operational reading for weekly management rituals." />
          <div style={matrixStyle}>
            <MatrixRow label="B2C Demand" signal={`${visibleLeads.length} active leads`} action="Protect response speed and follow-up discipline." />
            <MatrixRow label="B2B Contracts" signal={`${activeContracts.length} active contracts`} action="Push renewals, institutional deals and long-term packages." />
            <MatrixRow label="Cash Recovery" signal={MAD.format(unpaidRisk)} action="Recover overdue invoices and tighten payment confirmation." />
            <MatrixRow label="Mission Delivery" signal={`${activeMissions.length} active missions`} action="Secure caregiver coverage and prevent replacement emergencies." />
            <MatrixRow label="Quality Trust" signal={`${openIncidents.length} open incidents`} action="Close incidents before they damage brand trust." />
          </div>
        </section>
      </div>
    </AppShell>
  )
}

async function loadTable(supabase: any, table: string): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select('*').limit(500)
  if (error || !data) return []
  return data as Row[]
}

function Kpi({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: string }) {
  return <div style={{ ...kpiStyle, borderTop: `4px solid ${tone}` }}><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <div style={{ marginBottom: 18 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div>
}

function Signal({ signal }: { signal: RevenueSignal }) {
  const tone = signal.level === 'critical' ? '#ef4444' : signal.level === 'warning' ? '#f59e0b' : signal.level === 'opportunity' ? '#2563eb' : '#22c55e'
  return <div style={{ ...signalStyle, borderColor: `${tone}66`, background: `${tone}10` }}><div style={{ ...signalPillStyle, background: `${tone}22`, color: tone }}>{signal.level.toUpperCase()}</div><h3>{signal.title}</h3><p>{signal.message}</p><strong>{signal.action}</strong></div>
}

function ExecutiveAction({ index, title, value }: { index: string; title: string; value: string }) {
  return <div style={execActionStyle}><span>{index}</span><div><strong>{title}</strong><p>{value}</p></div></div>
}

function EngineCard({ title, label, value, detail, href, tone }: { title: string; label: string; value: string | number; detail: string; href: string; tone: string }) {
  return <a href={href} style={{ ...engineCardStyle, borderTop: `4px solid ${tone}` }}><span style={{ ...engineBadgeStyle, background: `${tone}22`, color: tone }}>{label}</span><h3>{title}</h3><strong>{value}</strong><p>{detail}</p></a>
}

function MatrixRow({ label, signal, action }: { label: string; signal: string; action: string }) {
  return <div style={matrixRowStyle}><strong>{label}</strong><span>{signal}</span><p>{action}</p></div>
}

function amountOf(row: Row): number {
  const candidates = ['amount', 'total', 'total_amount', 'invoice_amount', 'amount_due', 'paid_amount', 'value', 'contract_value', 'monthly_amount', 'monthly_price', 'price', 'estimated_value', 'pipeline_value']
  for (const key of candidates) {
    const value = Number(row[key])
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

function sumMoney(rows: Row[]): number { return rows.reduce((sum, row) => sum + amountOf(row), 0) }
function textOf(...values: any[]): string { return values.filter(Boolean).join(' ').toLowerCase() }
function includesAny(value: string, needles: string[]): boolean { return needles.some((needle) => value.includes(needle)) }
function boolish(value: any): boolean { return value === true || value === 'true' || value === 1 || value === '1' }
function dateOf(value: any): Date | null { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date }
function isSameOrAfter(date: Date | null, baseline: Date): boolean { return !!date && date >= baseline }
function invoiceDate(invoice: Row): Date | null { return dateOf(invoice.paid_at || invoice.payment_date || invoice.updated_at || invoice.created_at) }
function daysBetween(a: Date, b: Date): number { return Math.ceil((b.getTime() - a.getTime()) / 86400000) }
function isPaidInvoice(invoice: Row): boolean { return includesAny(textOf(invoice.status, invoice.payment_status), ['paid', 'settled', 'payé', 'paye']) || !!invoice.paid_at }
function isConvertedLead(lead: Row): boolean { return includesAny(textOf(lead.status, lead.stage, lead.pipeline_stage), ['converted', 'won', 'client', 'contract']) || !!lead.converted_at || !!lead.contract_id }

function computeRiskScore(input: { overdueRisk: number; unpaidRisk: number; openIncidents: number; overdueFollowups: number; supplyRatio: number }) {
  let score = 0
  if (input.overdueRisk > 0) score += 25
  if (input.unpaidRisk > 5000) score += 20
  if (input.openIncidents > 0) score += Math.min(20, input.openIncidents * 5)
  if (input.overdueFollowups > 0) score += Math.min(20, input.overdueFollowups * 4)
  if (input.supplyRatio < 70) score += 15
  return Math.min(100, score)
}

function buildSignals(input: any): RevenueSignal[] {
  const signals: RevenueSignal[] = []
  if (input.revenueMTD < input.target * 0.35) signals.push({ level: 'critical', title: 'Revenue below required pace', message: `MTD revenue is ${MAD.format(input.revenueMTD)} against ${MAD.format(input.target)} target.`, action: 'Increase daily closing pressure and recover unpaid invoices.' })
  if (input.overdueRisk > 0) signals.push({ level: 'critical', title: 'Cash recovery risk', message: `${MAD.format(input.overdueRisk)} is overdue.`, action: 'Assign immediate recovery owner and confirm payment dates.' })
  if (input.overdueFollowups.length > 0) signals.push({ level: 'warning', title: 'Follow-up pressure', message: `${input.overdueFollowups.length} leads are overdue for action.`, action: 'Protect response speed and call/WhatsApp all overdue leads today.' })
  if (input.conversionRate < 20 && input.visibleLeads.length > 5) signals.push({ level: 'warning', title: 'Conversion weakness', message: `Conversion rate is ${input.conversionRate}%.`, action: 'Review scripts, objections and manager coaching immediately.' })
  if (input.expiringContracts.length > 0) signals.push({ level: 'opportunity', title: 'Renewal window', message: `${input.expiringContracts.length} contracts are expiring soon.`, action: 'Trigger renewal offers before expiry and prevent revenue leakage.' })
  if (input.supplyRatio < 70 && input.activeMissions.length > 0) signals.push({ level: 'warning', title: 'Capacity bottleneck', message: `Supply ratio is ${input.supplyRatio}% against active missions.`, action: 'Recruit/stabilize caregivers and prepare backup replacements.' })
  if (input.openIncidents.length > 0) signals.push({ level: 'critical', title: 'Quality trust risk', message: `${input.openIncidents.length} incidents are open.`, action: 'Close incidents and communicate resolution to protect brand trust.' })
  if (!signals.length) signals.push({ level: 'healthy', title: 'System stable', message: 'No critical pressure detected from current data.', action: 'Maintain rhythm and push growth opportunities.' })
  return signals
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: 34, borderRadius: 34, background: 'linear-gradient(135deg,#020617,#0f172a 56%,#1e3a8a)', color: '#fff', boxShadow: '0 35px 90px rgba(2,6,23,.35)', border: '1px solid rgba(255,255,255,.10)' }
const heroGlowStyle: React.CSSProperties = { position: 'absolute', inset: -80, background: 'radial-gradient(circle at top left,rgba(59,130,246,.35),transparent 35%)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, color: '#fff', fontSize: 44, fontWeight: 1000, letterSpacing: -1 }
const heroTextStyle: React.CSSProperties = { margin: '8px 0 14px', color: 'rgba(255,255,255,.86)', fontWeight: 800 }
const heroMetaStyle: React.CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', color: 'rgba(255,255,255,.88)', fontWeight: 850, fontSize: 13 }
const pulseCardStyle: React.CSSProperties = { position: 'relative', zIndex: 1, minWidth: 310, padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', display: 'grid', gap: 8 }
const progressTrackStyle: React.CSSProperties = { height: 9, borderRadius: 999, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }
const progressFillStyle: React.CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#60a5fa)' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.35fr .65fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sidePanelStyle: React.CSSProperties = { ...panelStyle, position: 'sticky', top: 88 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const signalsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const signalStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 20, padding: 16, color: '#0f172a', display: 'grid', gap: 8 }
const signalPillStyle: React.CSSProperties = { width: 'fit-content', padding: '5px 9px', borderRadius: 999, fontSize: 11, fontWeight: 950 }
const execActionStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '38px 1fr', gap: 12, padding: 14, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', marginBottom: 10, color: '#0f172a' }
const engineGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const engineCardStyle: React.CSSProperties = { textDecoration: 'none', background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 18, color: '#0f172a', display: 'grid', gap: 8, boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const engineBadgeStyle: React.CSSProperties = { width: 'fit-content', padding: '6px 10px', borderRadius: 999, fontWeight: 950, fontSize: 12 }
const matrixStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const matrixRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '220px 180px 1fr', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
