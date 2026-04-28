import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function low(v: unknown) {
  return String(v || '').toLowerCase()
}

function pct(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export default async function RevenueCommandCenterPage() {
  const supabase = await createClient()

  const [leadsRes, missionsRes, caregiversRes, contractsRes, incidentsRes, familiesRes] = await Promise.all([
    supabase.from('leads').select('id,status,city,source,service_interest,created_at,is_archived').eq('is_archived', false).limit(300),
    supabase.from('missions').select('id,status,city,service_type,caregiver_id,mission_date,is_archived').eq('is_archived', false).limit(300),
    supabase.from('caregivers').select('id,status,current_status,city,is_archived').eq('is_archived', false).limit(300),
    supabase.from('contracts').select('id,status,client_type,city,total_sessions,sessions_used,is_archived').eq('is_archived', false).limit(300),
    supabase.from('incidents').select('id,status,city,incident_type,is_archived').eq('is_archived', false).limit(300),
    supabase.from('families').select('id,city,is_archived').eq('is_archived', false).limit(300),
  ])

  const leads = leadsRes.data || []
  const missions = missionsRes.data || []
  const caregivers = caregiversRes.data || []
  const contracts = contractsRes.data || []
  const incidents = incidentsRes.data || []

  const pendingLeads = leads.filter((l: any) => ['new', 'pending'].includes(low(l.status)))
  const wonContracts = contracts.filter((c: any) => ['active', 'won', 'signed'].includes(low(c.status)))
  const liveMissions = missions.filter((m: any) => low(m.status) === 'in_progress')
  const unassignedMissions = missions.filter((m: any) => !m.caregiver_id && !['completed', 'cancelled'].includes(low(m.status)))
  const availableCaregivers = caregivers.filter((c: any) => low(c.current_status || c.status) === 'available')
  const openIncidents = incidents.filter((i: any) => !['resolved', 'closed', 'archived'].includes(low(i.status)))

  const conversionPower = pct(wonContracts.length, leads.length)
  const supplyPressure = availableCaregivers.length <= 5 ? 'Critical' : availableCaregivers.length <= 12 ? 'Watch' : 'Stable'
  const riskLevel = openIncidents.length >= 5 ? 'High' : openIncidents.length >= 2 ? 'Medium' : 'Low'

  const cities = ['Casablanca', 'Rabat', 'Kénitra', 'Témara', 'Salé']
  const cityRows = cities.map((city) => {
    const cityLeads = leads.filter((x: any) => low(x.city).includes(low(city))).length
    const cityMissions = missions.filter((x: any) => low(x.city).includes(low(city))).length
    const citySupply = caregivers.filter((x: any) => low(x.city).includes(low(city)) && low(x.current_status || x.status) === 'available').length
    const cityRisks = incidents.filter((x: any) => low(x.city).includes(low(city)) && !['resolved', 'closed'].includes(low(x.status))).length
    return { city, cityLeads, cityMissions, citySupply, cityRisks }
  })

  const directives = [
    pendingLeads.length > 15 ? 'Immediate SDR focus: pending leads are above safe threshold. Prioritize WhatsApp + call follow-up before new acquisition spend.' : 'Lead volume under control: maintain response speed and focus on high-intent opportunities.',
    unassignedMissions.length > 0 ? 'Operations-revenue conflict detected: do not push aggressive campaigns until unassigned missions are reduced.' : 'Operations capacity is clean: acquisition can continue without immediate delivery pressure.',
    availableCaregivers.length < 8 ? 'Supply risk: activate caregiver recruitment, Academy sourcing, and city-level workforce reinforcement.' : 'Supply base is acceptable: continue matching quality and protect premium service reliability.',
    openIncidents.length > 2 ? 'Quality alert: open incidents require management review before scaling sensitive services.' : 'Quality status acceptable: keep monitoring incidents and feedback loops.',
    conversionPower < 10 ? 'Conversion improvement needed: upgrade scripts, offer framing, and lead qualification logic.' : 'Conversion engine is showing traction: push high-performing segments and capture more qualified demand.',
  ]

  return (
   <AppShell
  title="Revenue Command Center"
  subtitle="AI-guided national revenue operating system for B2B, B2C, supply, campaigns, quality and strategic growth."
  breadcrumbs={[{ label: 'Revenue Command Center' }]}
  actions={
    <>
      <PageAction href="/revenue-command-center/sdr-execution">SDR Execution</PageAction>
      <PageAction href="/revenue-command-center/b2c-workflow" variant="light">B2C Workflow</PageAction>
    </>
  }
>
      <section style={heroStyle}>
        <div>
          <div style={heroBadgeStyle}>AngelCare Revenue OS • ISO-aligned control cockpit</div>
          <h2 style={heroTitleStyle}>One command center to control acquisition, conversion, supply, risk and national expansion.</h2>
          <p style={heroTextStyle}>
            Built to guide managers and business development agents with live signals, decision priorities,
            quality safeguards and country-level growth logic.
          </p>
        </div>

        <div style={heroScoreStyle}>
          <div style={scoreLabelStyle}>Revenue Readiness</div>
          <div style={scoreValueStyle}>{Math.max(35, Math.min(96, conversionPower + availableCaregivers.length * 3 - openIncidents.length * 4))}%</div>
          <div style={scoreTextStyle}>Based on pipeline, supply and risk signals</div>
        </div>
      </section>

      <ERPPanel
        title="Strategic Intelligence Layer"
        subtitle="Executive-level indicators combining revenue, supply, risk and growth signals."
      >
        <div style={metricGridStyle}>
          <MetricCard label="Revenue Pressure" value={pendingLeads.length > 20 ? 'High' : 'Normal'} sub="lead backlog vs conversion capacity" icon="🔥" accent="#b91c1c" />
          <MetricCard label="Growth Opportunity" value={conversionPower < 15 ? 'Untapped' : 'Active'} sub="conversion vs market demand" icon="📊" accent="#1d4ed8" />
          <MetricCard label="Supply Stress" value={supplyPressure} sub="caregiver availability vs demand" icon="⚙️" accent="#7c3aed" />
          <MetricCard label="Risk Exposure" value={riskLevel} sub="incidents & quality signals" icon="🚨" accent="#991b1b" />
        </div>
      </ERPPanel>

      <section style={metricGridStyle}>
        <MetricCard label="Pending leads" value={pendingLeads.length} sub="SDR priority queue" icon="📈" accent="#7c3aed" />
        <MetricCard label="Won / active contracts" value={wonContracts.length} sub={`${conversionPower}% lead-to-contract power`} icon="💰" accent="#166534" />
        <MetricCard label="Live missions" value={liveMissions.length} sub={`${unassignedMissions.length} unassigned`} icon="🟢" accent="#1d4ed8" />
        <MetricCard label="Caregiver supply" value={availableCaregivers.length} sub={supplyPressure} icon="👩‍👧" accent="#0f766e" />
        <MetricCard label="Open risks" value={openIncidents.length} sub={riskLevel} icon="🚨" accent="#991b1b" />
      </section>

      <div style={twoColStyle}>
        <ERPPanel title="AI Daily Directives" subtitle="Manager-ready priorities generated from live OpsOS signals.">
          <div style={{ display: 'grid', gap: 10 }}>
            {directives.map((d, i) => (
              <div key={i} style={directiveStyle}>
                <span style={directiveIndexStyle}>{String(i + 1).padStart(2, '0')}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </ERPPanel>

        <ERPPanel title="ISO-Aligned Governance" subtitle="Control logic for quality, traceability and accountable decisions.">
          <div style={governanceGridStyle}>
            <GovernanceItem title="Access Control" text="Managers and BD-only workspace with future RBAC enforcement." tone="blue" />
            <GovernanceItem title="Decision Traceability" text="Every recommendation should become logged as directive, action or override." tone="purple" />
            <GovernanceItem title="Risk Review" text="Incidents and service failures block unsafe scaling decisions." tone="red" />
            <GovernanceItem title="Continuous Improvement" text="Weekly review cycle for scripts, campaigns, conversion and quality." tone="green" />
          </div>
        </ERPPanel>
      </div>

      <ERPPanel
        title="Operational Command Grid"
        subtitle="Each revenue engine analyzed through signal → diagnosis → action logic."
      >
        <div style={moduleGridStyle}>
          <Module title="B2C Command" badge="Families" color="green" text={`Signal: ${pendingLeads.length} leads → Action: prioritize conversion`} />
          <Module title="B2B Command" badge="Institutions" color="blue" text={`Signal: ${wonContracts.length} contracts → Action: push partnerships`} />
          <Module title="Supply Command" badge="Workforce" color="purple" text={`Signal: ${availableCaregivers.length} available → Action: recruit or stabilize`} />
          <Module title="Campaign Command" badge="Acquisition" color="amber" text="Evaluate campaign ROI before scaling." />
          <Module title="Quality Command" badge="Risk" color="red" text={`${openIncidents.length} incidents → enforce quality control`} />
        </div>
      </ERPPanel>

      <ERPPanel title="Revenue Machine Modules" subtitle="Full 360° business development generator engine for Morocco.">
        <div style={moduleGridStyle}>
          <Module title="AI Orchestrator" badge="Core Brain" color="purple" text="Coordinates all engines, detects priorities and creates daily battle plans." />
          <Module href="/revenue-command-center/b2c-workflow" title="B2C Workflow" badge="B2C Engine" color="green" text="Family lead pipeline for parents, postpartum, special needs, childcare and educational services." />
          <Module href="/revenue-command-center/sdr-execution" title="SDR Execution System" badge="Revenue Strike" color="red" text="Multi-agent execution board for calls, WhatsApp, SLA enforcement, reminders, recovery and performance pressure." />
          <Module title="B2B Capture Engine" badge="Institutions" color="blue" text="Schools, clinics, corporates, HR benefits, proposals and partnerships." />
          <Module title="SDR Productivity Engine" badge="Execution" color="amber" text="Lead ranking, follow-up discipline, calling priorities and script direction." />
          <Module title="Campaign Intelligence" badge="Marketing ROI" color="purple" text="Meta Ads, creatives, city demand, source quality and cost-to-client logic." />
          <Module title="Supply-Demand Control" badge="Capacity" color="green" text="Caregiver availability, recruitment triggers and Academy sourcing signals." />
          <Module title="Pricing & Packaging Engine" badge="Profit" color="blue" text="Service pricing, packages, urgency premium and city-based revenue logic." />
          <Module title="Retention & LTV Engine" badge="Expansion" color="amber" text="Upsell, renewal, subscriptions, repeat clients and referral loops." />
          <Module title="Quality & Risk Engine" badge="Trust" color="red" text="Incidents, complaints, replacements, trust protection and brand control." />
          <Module title="National City Control" badge="Scale" color="blue" text="Casablanca, Rabat, Kénitra, Témara, Salé and future city pods." />
          <Module title="Partnership Pipeline" badge="B2B Deals" color="purple" text="Institution targeting, decision-maker mapping and recurring contracts." />
          <Module title="Executive CFO Lens" badge="Performance" color="green" text="CAC, LTV, conversion, profitability and investment discipline." />
        </div>
      </ERPPanel>

      <div style={twoColStyle}>
        <ERPPanel title="City Control Matrix" subtitle="Moroccan market view by demand, supply and risk.">
          <div style={{ display: 'grid', gap: 10 }}>
            {cityRows.map((r) => (
              <div key={r.city} style={cityRowStyle}>
                <strong style={{ color: '#0f172a' }}>{r.city}</strong>
                <span>Leads: {r.cityLeads}</span>
                <span>Missions: {r.cityMissions}</span>
                <span>Supply: {r.citySupply}</span>
                <StatusPill tone={r.cityRisks > 0 ? 'red' : 'green'}>{r.cityRisks > 0 ? `${r.cityRisks} risks` : 'clean'}</StatusPill>
              </div>
            ))}
          </div>
        </ERPPanel>

        <ERPPanel title="Manager Action Board" subtitle="What leadership should enforce this week.">
          <div style={{ display: 'grid', gap: 10 }}>
            <Action title="Protect response speed" text="All hot leads should receive WhatsApp + call attempt within operational SLA." />
            <Action title="Balance selling with delivery" text="Pause aggressive selling in any city where supply becomes weak." />
            <Action title="Push B2B stability" text="Prioritize schools, clinics and corporates for recurring revenue." />
            <Action title="Use Academy as supply weapon" text="Recruit and train caregivers before market demand exceeds capacity." />
          </div>
        </ERPPanel>
      </div>

      <ERPPanel title="Decision & Control System" subtitle="Governance layer for disciplined execution and future AI automation.">
        <div style={{ display: 'grid', gap: 10 }}>
          <Action title="Decision Traceability" text="All strategic decisions must be logged and reviewed." />
          <Action title="Weekly Revenue Review" text="Review B2C, B2B, supply and risk every week." />
          <Action title="Execution Discipline" text="Ensure SDR and BD follow AI directives daily." />
          <Action title="Scaling Gate" text="No scaling without supply stability and quality validation." />
        </div>
      </ERPPanel>
    </AppShell>
  )
}

function Module({ title, text, badge, color, href }: any) {
  const content = (
    <div style={cardStyle}>
      <StatusPill tone={color}>{badge}</StatusPill>
      <h3 style={titleStyle}>{title}</h3>
      <p style={textStyle}>{text}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    )
  }

  return content
}

function GovernanceItem({ title, text, tone }: any) {
  return (
    <div style={governanceItemStyle}>
      <StatusPill tone={tone}>{title}</StatusPill>
      <p style={textStyle}>{text}</p>
    </div>
  )
}

function Action({ title, text }: any) {
  return (
    <div style={actionStyle}>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 22,
  flexWrap: 'wrap',
  padding: 28,
  borderRadius: 30,
  background: 'radial-gradient(circle at top left,#312e81 0,#0f172a 45%,#020617 100%)',
  color: '#fff',
  marginBottom: 18,
  boxShadow: '0 28px 80px rgba(15,23,42,.26)',
}

const heroBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.12)',
  color: '#c4b5fd',
  fontSize: 12,
  fontWeight: 950,
  marginBottom: 12,
}

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: -1.1,
  maxWidth: 850,
}

const heroTextStyle: React.CSSProperties = {
  color: '#dbeafe',
  fontWeight: 650,
  lineHeight: 1.7,
  maxWidth: 850,
  margin: '12px 0 0',
}

const heroScoreStyle: React.CSSProperties = {
  minWidth: 240,
  padding: 20,
  borderRadius: 24,
  background: 'rgba(255,255,255,.1)',
  border: '1px solid rgba(255,255,255,.16)',
}

const scoreLabelStyle: React.CSSProperties = {
  color: '#cbd5e1',
  fontWeight: 800,
}

const scoreValueStyle: React.CSSProperties = {
  fontSize: 46,
  fontWeight: 950,
  marginTop: 8,
}

const scoreTextStyle: React.CSSProperties = {
  color: '#cbd5e1',
  fontWeight: 650,
}

const metricGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5,minmax(0,1fr))',
  gap: 14,
  marginBottom: 18,
}

const twoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr .8fr',
  gap: 18,
  marginBottom: 18,
}

const moduleGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 14,
}

const governanceGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const governanceItemStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}

const directiveStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  padding: 15,
  borderRadius: 18,
  background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
  color: '#fff',
  fontWeight: 850,
  lineHeight: 1.5,
}

const directiveIndexStyle: React.CSSProperties = {
  color: '#c4b5fd',
  fontWeight: 950,
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: '1px solid #e2e8f0',
  background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
  boxShadow: '0 12px 30px rgba(15,23,42,.045)',
}

const titleStyle: React.CSSProperties = {
  margin: '14px 0 8px',
  color: '#0f172a',
  fontWeight: 950,
}

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontWeight: 650,
  lineHeight: 1.6,
}

const cityRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr repeat(4,.8fr)',
  gap: 10,
  alignItems: 'center',
  padding: 14,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#64748b',
  fontWeight: 750,
}

const actionStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#0f172a',
}