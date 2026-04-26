import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppShell, { PageAction } from './components/erp/AppShell'
import { ERPPanel, MetricCard, ModuleCard, StatusPill } from './components/erp/ERPPrimitives'

function low(v: unknown) { return String(v || '').toLowerCase() }
function todayISO() { return new Date().toISOString().slice(0, 10) }

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = todayISO()
  const [missionsRes, incidentsRes, contractsRes, caregiversRes, familiesRes, leadsRes] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }),
    supabase.from('incidents').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('contracts').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('caregivers').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('families').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('leads').select('*').eq('is_archived', false).order('id', { ascending: false }),
  ])

  const missions = missionsRes.data || []
  const incidents = incidentsRes.data || []
  const contracts = contractsRes.data || []
  const caregivers = caregiversRes.data || []
  const families = familiesRes.data || []
  const leads = leadsRes.data || []
  const missionsToday = missions.filter((m: any) => m.mission_date === today)
  const activeIncidents = incidents.filter((i: any) => !['resolved','closed','archived'].includes(low(i.status)))
  const unassigned = missions.filter((m: any) => !m.caregiver_id && !['completed','cancelled'].includes(low(m.status)))
  const inProgress = missions.filter((m: any) => low(m.status) === 'in_progress')
  const completedToday = missionsToday.filter((m: any) => low(m.status) === 'completed')
  const activeContracts = contracts.filter((c: any) => low(c.status) === 'active')
  const contractsLow = contracts.filter((c: any) => Number(c.total_sessions || 0) > 0 && Number(c.total_sessions || 0) - Number(c.sessions_used || 0) <= 2)
  const pendingLeads = leads.filter((l: any) => ['new','pending'].includes(low(l.status)))
  const availableCaregivers = caregivers.filter((c: any) => low(c.current_status || c.status) === 'available')
  const totalTodayHours = missionsToday.reduce((sum: number, m: any) => sum + Number(m.duration_hours || 0), 0)

  return (
    <AppShell
      title="Executive Operations Command Center"
      subtitle="Premium ERP cockpit for sales, operations, contracts, workforce, print templates and executive control."
      breadcrumbs={[{ label: 'Control Center' }]}
      actions={
        <>
          <PageAction href="/revenue-command-center">Revenue Command Center</PageAction>
          <PageAction href="/sales">Sales Cockpit</PageAction>
          <PageAction href="/services" variant="light">Service Catalog</PageAction>
          <PageAction href="/print" variant="light">Print Center</PageAction>
        </>
      }
    >
      <section style={heroStyle}>
        <div>
          <div style={heroBadgeStyle}>AngelCare ERP 2026 • Multi-location / Multi-service Ready</div>
          <h2 style={heroTitleStyle}>From daily operations to full corporate control.</h2>
          <p style={heroTextStyle}>A structured operating system for families, institutions, caregivers, services, packages, contracts, missions, pointage, reports and printable documents.</p>
        </div>
        <div style={heroTilesStyle}>
          <StatusPill tone="green">Casablanca</StatusPill>
          <StatusPill tone="blue">Rabat</StatusPill>
          <StatusPill tone="purple">Kénitra</StatusPill>
          <StatusPill tone="amber">Future cities</StatusPill>
        </div>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Missions today" value={missionsToday.length} sub={`${totalTodayHours} hours planned`} icon="🛫" />
        <MetricCard label="In progress" value={inProgress.length} sub="live field execution" icon="🟢" accent="#166534" />
        <MetricCard label="Unassigned" value={unassigned.length} sub="dispatch attention" icon="⚠️" accent="#b45309" />
        <MetricCard label="Open incidents" value={activeIncidents.length} sub="quality & risk" icon="🚨" accent="#991b1b" />
        <MetricCard label="Active contracts" value={activeContracts.length} sub={`${contractsLow.length} low balance`} icon="📦" accent="#1d4ed8" />
        <MetricCard label="Available caregivers" value={availableCaregivers.length} sub={`${caregivers.length} total workforce`} icon="👩‍👧" accent="#166534" />
        <MetricCard label="Families CRM" value={families.length} sub="B2C customer base" icon="🏡" accent="#0f766e" />
        <MetricCard label="Pending leads" value={pendingLeads.length} sub="sales follow-up" icon="📈" accent="#7c3aed" />
        <MetricCard label="Completed today" value={completedToday.length} sub="daily delivery" icon="🏁" accent="#166534" />
        <MetricCard label="ERP modules" value="11" sub="corporate navigation groups" icon="🧩" accent="#0f172a" />
      </section>

      <section style={moduleGridStyle}>
        <ModuleCard href="/revenue-command-center" icon="🧠" title="Revenue Command Center" text="AI-guided strategic workspace for B2B, B2C, acquisition, daily directives, revenue prioritization and national growth control." badge="AI RevOps" />
        <ModuleCard href="/sales" icon="🚀" title="Advanced Sales System" text="Pipeline, client types, institutions, quotations, proposals, follow-up reminders, campaign source and renewal view." badge="Sales CRM" />
        <ModuleCard href="/services" icon="🧩" title="Products & Services Management" text="Flexible catalog for services, packages, pricing rules, cities, durations, skills, status and checklists." badge="Catalog" />
        <ModuleCard href="/print" icon="🖨️" title="Print & Document Templates" text="Pre-installed corporate templates for contracts, mission orders, incident reports, quotes and certificates." badge="Print" />
        <ModuleCard href="/locations" icon="📍" title="Multi-location Architecture" text="Branches, cities, zones, multi-service lines and client-type segmentation for scalable operations." badge="Cities" />
        <ModuleCard href="/reports" icon="📊" title="Executive Reporting" text="Revenue projection, city performance, conversion, service profitability, renewals and staff activity." badge="Control" />
        <ModuleCard href="/academy" icon="🎓" title="Academy Management" text="Training programs, certificates, B2B training and caregiver capability development." badge="Academy" />
      </section>

      <div style={twoColStyle}>
        <ERPPanel title="Operations Live Board" subtitle="High-signal overview for dispatch and daily supervision.">
          <div style={{ display:'grid', gap:10 }}>
            {missionsToday.slice(0, 8).map((m: any) => (
              <Link key={m.id} href={`/missions/${m.id}`} style={rowStyle}>
                <div><div style={rowTitleStyle}>{m.mission_code || `Mission #${m.id}`}</div><div style={rowMetaStyle}>{m.service_type || 'Service'} • {m.city || 'City'} • {m.start_time || '--:--'} → {m.end_time || '--:--'}</div></div>
                <StatusPill tone={low(m.status) === 'incident' ? 'red' : low(m.status) === 'completed' ? 'green' : 'blue'}>{m.status || 'draft'}</StatusPill>
              </Link>
            ))}
            {missionsToday.length === 0 ? <div style={emptyStyle}>No missions scheduled today.</div> : null}
          </div>
        </ERPPanel>

        <ERPPanel title="Executive Alerts" subtitle="Priority signals from sales, operations, contracts and quality.">
          <div style={{ display:'grid', gap:10 }}>
            {unassigned.slice(0, 3).map((m: any) => <div key={`u-${m.id}`} style={alertStyle}>Unassigned mission • {m.mission_code || `Mission #${m.id}`}</div>)}
            {activeIncidents.slice(0, 3).map((i: any) => <div key={`i-${i.id}`} style={dangerStyle}>Open incident • {i.incident_title || i.incident_type || `Incident #${i.id}`}</div>)}
            {contractsLow.slice(0, 3).map((c: any) => <div key={`c-${c.id}`} style={warningStyle}>Low contract balance • {c.contract_reference || `Contract #${c.id}`}</div>)}
            {unassigned.length + activeIncidents.length + contractsLow.length === 0 ? <div style={emptyStyle}>No critical signal active.</div> : null}
          </div>
        </ERPPanel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:20, flexWrap:'wrap', alignItems:'flex-start', padding:26, borderRadius:28, background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#075985 100%)', color:'#fff', marginBottom:18, boxShadow:'0 24px 70px rgba(15,23,42,.22)' }
const heroBadgeStyle: React.CSSProperties = { display:'inline-flex', padding:'8px 12px', borderRadius:999, background:'rgba(255,255,255,.12)', color:'#dbeafe', fontSize:12, fontWeight:950, marginBottom:12 }
const heroTitleStyle: React.CSSProperties = { margin:0, color:'#fff', fontSize:34, fontWeight:950, letterSpacing:-1.1, maxWidth:780 }
const heroTextStyle: React.CSSProperties = { color:'#dbeafe', fontWeight:650, lineHeight:1.7, maxWidth:800, margin:'12px 0 0' }
const heroTilesStyle: React.CSSProperties = { display:'flex', gap:10, flexWrap:'wrap', maxWidth:360, justifyContent:'flex-end' }
const metricGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(5,minmax(0,1fr))', gap:14, marginBottom:18 }
const moduleGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14, marginBottom:18 }
const twoColStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1.25fr .9fr', gap:18 }
const rowStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, padding:14, border:'1px solid #e2e8f0', borderRadius:16, background:'#fff', textDecoration:'none' }
const rowTitleStyle: React.CSSProperties = { color:'#0f172a', fontWeight:950, marginBottom:6 }
const rowMetaStyle: React.CSSProperties = { color:'#64748b', fontSize:13, fontWeight:650, lineHeight:1.5 }
const emptyStyle: React.CSSProperties = { padding:14, borderRadius:16, border:'1px dashed #cbd5e1', color:'#64748b', background:'#fff', fontWeight:700 }
const alertStyle: React.CSSProperties = { padding:14, borderRadius:16, border:'1px solid #fed7aa', background:'#fff7ed', color:'#9a3412', fontWeight:900 }
const dangerStyle: React.CSSProperties = { padding:14, borderRadius:16, border:'1px solid #fecaca', background:'#fff7f7', color:'#991b1b', fontWeight:900 }
const warningStyle: React.CSSProperties = { padding:14, borderRadius:16, border:'1px solid #fde68a', background:'#fffbeb', color:'#92400e', fontWeight:900 }