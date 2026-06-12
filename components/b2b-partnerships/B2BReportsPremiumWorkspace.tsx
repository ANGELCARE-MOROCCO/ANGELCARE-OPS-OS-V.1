'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BReportsPremiumWorkspace.module.css'

type AnyRow = Record<string, any>
type SectorKey = 'all' | 'hospitality' | 'healthcare' | 'education' | 'corporate' | 'events'
type ReportPurpose = 'executive' | 'weekly' | 'sector' | 'revenue' | 'performance' | 'risk' | 'agent' | 'pipeline' | 'conversion' | 'market' | 'partnerScorecard' | 'actionReview' | 'forecast' | 'closing' | 'team' | 'audit'
type ViewMode = 'command' | 'templates' | 'generated' | 'controller' | 'print'
type ModalMode = 'create' | 'view' | null

type ReportRecord = {
  id: string
  reference: string
  purpose: ReportPurpose
  sector: SectorKey
  title: string
  period: string
  status: string
  generatedAt: string
  owner: string
  executiveSummary: string
  alerts: string[]
  congratulations: string[]
  coaching: string[]
  revenueMoves: string[]
  reminders: string[]
  marketInsights: string[]
  kpis: { label: string; value: string; interpretation: string }[]
  actionPlan: string[]
}

const SECTORS: { key: SectorKey; label: string; icon: string; description: string }[] = [
  { key: 'all', label: 'All sectors', icon: '🧭', description: 'Global B2B portfolio view across all partner categories.' },
  { key: 'hospitality', label: 'Hotels & Resorts', icon: '🏨', description: 'Hotels, resorts, riads, serviced residences and family guest experience.' },
  { key: 'healthcare', label: 'Healthcare & Pediatrics', icon: '🏥', description: 'Clinics, pediatric practices, medical centers and family health partners.' },
  { key: 'education', label: 'Schools & Childcare', icon: '🎓', description: 'Private schools, crèches, educational groups and family services.' },
  { key: 'corporate', label: 'Corporate Employers', icon: '🏢', description: 'Companies, banks, institutions, HR teams and employee-parent benefits.' },
  { key: 'events', label: 'Events & Venues', icon: '🎉', description: 'Event venues, wedding planners, agencies and premium family events.' },
]

const TEMPLATES: { purpose: ReportPurpose; title: string; icon: string; description: string; bestFor: string }[] = [
  { purpose: 'executive', title: 'Executive Board Report', icon: '📊', description: 'High-level decision report for leadership, risks, opportunities and next strategic moves.', bestFor: 'CEO / Managing Director / B2B Head' },
  { purpose: 'weekly', title: 'Weekly B2B Performance Report', icon: '📅', description: 'Weekly operating rhythm with activity, progress, blockers, wins and next-week priorities.', bestFor: 'Team management and weekly control' },
  { purpose: 'sector', title: 'Sector Domination Report', icon: '🎯', description: 'Sector-specific report with Morocco market logic, partner types, offers and expansion path.', bestFor: 'Hotels, clinics, schools, corporates or events' },
  { purpose: 'revenue', title: 'Revenue Acceleration Report', icon: '🚀', description: 'Commercial report focused on revenue moves, conversion pressure and upsell opportunities.', bestFor: 'Sales acceleration and BD execution' },
  { purpose: 'performance', title: 'Team Performance Coaching Report', icon: '💪', description: 'Controller-generated coaching report to push ownership, discipline and result intensity.', bestFor: 'B2B intern, BD team, sales agents' },
  { purpose: 'risk', title: 'Risk & Recovery Report', icon: '🚨', description: 'Identifies late actions, weak pipeline areas, missing follow-up and recovery plan.', bestFor: 'Manager alerts and operational correction' },
  { purpose: 'agent', title: 'Controller Agent Intelligence Report', icon: '🧠', description: 'Smart manager-agent report that congratulates, alerts, motivates and recommends actions.', bestFor: 'Daily or weekly manager intelligence' },
  { purpose: 'pipeline', title: 'Pipeline Health Report', icon: '🧱', description: 'Numerical pipeline report showing portfolio size, movement quality, stage pressure and weak spots.', bestFor: 'Pipeline governance' },
  { purpose: 'conversion', title: 'Conversion & Closing Report', icon: '📈', description: 'Conversion-focused template tracking meetings, proposals, closing pressure and lost momentum.', bestFor: 'Commercial conversion control' },
  { purpose: 'market', title: 'Morocco Market Opportunity Report', icon: '🇲🇦', description: 'Market-fit report for Moroccan partner sectors with practical domination angles and trust logic.', bestFor: 'Sector expansion and positioning' },
  { purpose: 'partnerScorecard', title: 'Partner Scorecard Report', icon: '🏆', description: 'Scorecard-style report ranking partner quality, fit, revenue potential and next action urgency.', bestFor: 'A/B/C partner prioritization' },
  { purpose: 'actionReview', title: 'Action Review Report', icon: '✅', description: 'Execution report focused on actions completed, overdue load, blockers and immediate correction.', bestFor: 'Daily and weekly execution discipline' },
  { purpose: 'forecast', title: 'Revenue Forecast Report', icon: '🔮', description: 'Forecast-style report estimating potential revenue, proposal upside and short-term closing path.', bestFor: 'Management forecast and targets' },
  { purpose: 'closing', title: 'Deal Closing Report', icon: '🤝', description: 'Closing-room template for decision makers, objections, next meetings and conversion plan.', bestFor: 'Hot opportunities and final push' },
  { purpose: 'team', title: 'Team Productivity Report', icon: '👥', description: 'Performance report built around user productivity, output rhythm, discipline and coaching.', bestFor: 'BD team and intern management' },
  { purpose: 'audit', title: 'Audit Traceability Report', icon: '🧾', description: 'Referenced report for audit trail, decisions, risks, evidence, generated reports and manager notes.', bestFor: 'Governance and audit readiness' },
]

function normalizeArray(payload: any): AnyRow[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  return []
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: 'no-store' })
  const text = await response.text()
  let payload: any = null
  try { payload = text ? JSON.parse(text) : null } catch { payload = null }
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Request failed: ${path}`)
  return payload
}

function refFor(purpose: ReportPurpose, sector: SectorKey) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const time = String(Date.now()).slice(-5)
  return `ANG-B2B-RPT-${purpose.toUpperCase()}-${sector.toUpperCase()}-${stamp}-${time}`
}

function todayFr() {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())
}

function sectorLabel(key: SectorKey) {
  return SECTORS.find((s) => s.key === key)?.label || 'All sectors'
}

function purposeLabel(key: ReportPurpose) {
  return TEMPLATES.find((t) => t.purpose === key)?.title || 'B2B Report'
}

function templateIntelligence(purpose: ReportPurpose, sector: SectorKey, metrics: {
  activeProspects: number
  openTasks: number
  proposalCount: number
  meetingCount: number
  programCount: number
  meetingRate: number
  proposalRate: number
}) {
  const sectorName = sectorLabel(sector)

  const base = {
    executiveSummary: '',
    alerts: [] as string[],
    congratulations: [] as string[],
    coaching: [] as string[],
    revenueMoves: [] as string[],
    reminders: [] as string[],
    marketInsights: [] as string[],
    actionPlan: [] as string[],
  }

  const numbersLine = `${metrics.activeProspects} prospects, ${metrics.meetingCount} meetings, ${metrics.proposalCount} proposals, ${metrics.openTasks} open tasks and ${metrics.programCount} strategic programs.`

  switch (purpose) {
    case 'executive':
      return {
        ...base,
        executiveSummary: `Executive review for ${sectorName}. Current B2B machine shows ${numbersLine} Leadership should focus on strategic prioritization, decision-maker access and conversion discipline.`,
        alerts: [
          metrics.proposalRate < 15 ? 'Proposal rate is below executive-grade commercial intensity.' : 'Proposal rate is acceptable; leadership must now push closing discipline.',
          metrics.meetingRate < 10 ? 'Meeting creation is too light versus portfolio size.' : 'Meeting base exists; convert meetings into signed next steps.',
          'Leadership should remove low-value activities and protect only revenue-driving actions.',
        ],
        congratulations: [
          'The B2B command center now has auditable reporting, proposal generation and sector programs.',
          'The system is ready to support weekly executive reviews.',
        ],
        coaching: [
          'Management must ask one question daily: which accounts moved closer to revenue today?',
          'Focus team effort on A-priority prospects, not broad low-conversion outreach.',
        ],
        revenueMoves: [
          'Push the top 10 accounts into proposal or meeting status.',
          'Assign owners and closing dates to every proposal.',
          'Use sector-specific programs as the commercial argument.',
        ],
        reminders: [
          'Every board report must end with decisions, owners and deadlines.',
          'Do not accept reports without next actions.',
        ],
        marketInsights: [
          'In Morocco, premium partners value trust, seriousness and personal follow-up.',
          'Decision-maker access is more important than mass outreach volume.',
        ],
        actionPlan: [
          'Select top 10 strategic accounts.',
          'Validate owner and next action per account.',
          'Generate decision-maker proposals.',
          'Review close probability weekly.',
        ],
      }

    case 'weekly':
      return {
        ...base,
        executiveSummary: `Weekly operating report for ${sectorName}. The week should be judged by movement: calls, meetings, proposals, follow-ups and closed blockers.`,
        alerts: [
          metrics.openTasks > metrics.activeProspects ? 'Open task load is heavier than portfolio discipline allows.' : 'Task load is manageable if follow-up discipline is protected.',
          'Any task without owner/date should be corrected before the next week starts.',
        ],
        congratulations: [
          'Weekly reporting discipline is now in place.',
          'The team can now track progress instead of relying on memory.',
        ],
        coaching: [
          'Start each morning with the top 5 priority accounts.',
          'End each day by updating next actions and follow-up dates.',
          'No meeting should remain without a written follow-up.',
        ],
        revenueMoves: [
          'Turn this week’s warm conversations into proposals.',
          'Re-contact prospects that received proposals but did not answer.',
        ],
        reminders: [
          'Monday: prioritize accounts.',
          'Wednesday: push meetings.',
          'Friday: close reports and prepare next-week actions.',
        ],
        marketInsights: [
          'Moroccan B2B follow-up requires respectful persistence.',
          'WhatsApp plus phone plus email is stronger than one isolated channel.',
        ],
        actionPlan: [
          'Clear overdue tasks.',
          'Book decision-maker meetings.',
          'Send pending proposals.',
          'Prepare next-week account list.',
        ],
      }

    case 'sector':
      return {
        ...base,
        executiveSummary: `Sector domination report for ${sectorName}. The objective is to build a sector-specific offer, message, partner list and conversion path.`,
        alerts: [
          'Generic messaging will weaken conversion. Sector-specific language is mandatory.',
          metrics.programCount < 5 ? 'Program library is too light for domination positioning.' : 'Program base is strong enough for sector outreach.',
        ],
        congratulations: [
          `${sectorName} can now be approached with dedicated positioning.`,
          'Program-based selling increases credibility and decision-maker interest.',
        ],
        coaching: [
          'Speak the language of the sector: hotels want guest experience, clinics want trust, schools want parent convenience, corporates want HR value.',
          'Avoid sending the same pitch to different partner types.',
        ],
        revenueMoves: [
          'Create 3 sector-specific proposals.',
          'Prepare one flagship program for this sector.',
          'Target decision makers directly.',
        ],
        reminders: [
          'Every sector needs its own objections handling.',
          'Every sector needs its own proof and benefits.',
        ],
        marketInsights: [
          `${sectorName} in Morocco requires trust-first positioning and clear operational seriousness.`,
          'Premium partners respond to concrete benefits more than abstract innovation.',
        ],
        actionPlan: [
          'Build top 20 sector target list.',
          'Prepare flagship program pitch.',
          'Create proposal template for this sector.',
          'Launch 5 decision-maker contacts.',
        ],
      }

    case 'revenue':
    case 'forecast':
      return {
        ...base,
        executiveSummary: `Revenue acceleration report for ${sectorName}. Focus is pipeline value, proposal intensity, closing probability and short-term monetization.`,
        alerts: [
          metrics.proposalCount < 3 ? 'Proposal base is too low to forecast meaningful revenue.' : 'Proposal base exists; closing discipline is now the bottleneck.',
          'Revenue cannot be forecast from prospects without meetings or proposals.',
        ],
        congratulations: [
          'Revenue reporting creates pressure toward real outcomes.',
          'The system can now separate activity from commercial movement.',
        ],
        coaching: [
          'Stop counting only contacts; count commercial movement.',
          'Every hot prospect needs a price model, next action and deadline.',
        ],
        revenueMoves: [
          'Push bundled sector programs instead of isolated services.',
          'Convert meetings into proposals within 24 hours.',
          'Create urgency with pilot windows and limited launch capacity.',
        ],
        reminders: [
          'Pipeline without close date is not forecastable.',
          'Proposal without follow-up is not revenue.',
        ],
        marketInsights: [
          'Moroccan premium buyers often need reassurance before price discussion.',
          'Pilot-first offers reduce friction and increase acceptance.',
        ],
        actionPlan: [
          'Rank opportunities by close probability.',
          'Attach estimated monthly value.',
          'Schedule closing calls.',
          'Send revised proposal to warm accounts.',
        ],
      }

    case 'performance':
    case 'team':
      return {
        ...base,
        executiveSummary: `Team performance report for ${sectorName}. Focus is ownership, output rhythm, accountability and continuous improvement.`,
        alerts: [
          metrics.openTasks > 15 ? 'Execution load may dilute focus if not prioritized.' : 'Execution load is acceptable.',
          'Low meeting/proposal creation should trigger coaching, not excuses.',
        ],
        congratulations: [
          'The team now has a clearer command structure.',
          'Progress becomes visible when reports are generated consistently.',
        ],
        coaching: [
          'High performance means daily visible movement.',
          'The best BD agents do not wait; they create next steps.',
          'Managers should coach behavior, not only outcomes.',
        ],
        revenueMoves: [
          'Reward agents who create qualified meetings.',
          'Use proposal output as a serious performance indicator.',
        ],
        reminders: [
          'Each owner must close the day with updated CRM status.',
          'No task should be left vague.',
        ],
        marketInsights: [
          'In Morocco, discipline and relationship follow-up beat aggressive selling.',
        ],
        actionPlan: [
          'Review output by owner.',
          'Identify stuck behaviors.',
          'Set daily minimum actions.',
          'Celebrate wins and raise standard immediately.',
        ],
      }

    case 'risk':
    case 'actionReview':
      return {
        ...base,
        executiveSummary: `Risk and action review for ${sectorName}. Focus is blocked work, overdue follow-up, missing ownership and recovery moves.`,
        alerts: [
          'Any opportunity without next action is a silent revenue leak.',
          metrics.openTasks > 10 ? 'Open task volume requires manager review.' : 'No extreme task overload detected.',
          'Delayed follow-up damages trust in Moroccan B2B relationships.',
        ],
        congratulations: [
          'Risk visibility is now available before losses become invisible.',
        ],
        coaching: [
          'Managers must treat unclear ownership as a risk.',
          'Recovery starts by simplifying: owner, next action, deadline.',
        ],
        revenueMoves: [
          'Recover warm proposals first.',
          'Escalate accounts with high value and no response.',
        ],
        reminders: [
          'Risk reports should be reviewed before weekly planning.',
          'Remove dead accounts or revive them with a clear action.',
        ],
        marketInsights: [
          'Relationship-based markets punish inconsistent follow-up.',
        ],
        actionPlan: [
          'List blocked accounts.',
          'Assign owners.',
          'Set 48-hour recovery action.',
          'Close or escalate stale items.',
        ],
      }

    case 'pipeline':
    case 'conversion':
    case 'closing':
      return {
        ...base,
        executiveSummary: `Pipeline and conversion report for ${sectorName}. Focus is stage movement, meetings, proposals, close probability and objection handling.`,
        alerts: [
          metrics.meetingRate < 10 ? 'Meeting conversion is weak.' : 'Meeting conversion is developing.',
          metrics.proposalRate < 15 ? 'Proposal conversion is weak.' : 'Proposal conversion is developing.',
          'Closing requires decision-maker clarity, not only relationship warmth.',
        ],
        congratulations: [
          'Pipeline reporting makes weak stages visible.',
          'The team can now focus on conversion, not only outreach.',
        ],
        coaching: [
          'Every stage must have one conversion question: what moves this account forward?',
          'Do not let meetings end without next step agreement.',
        ],
        revenueMoves: [
          'Create closing script for hot proposals.',
          'Prepare objection handling by sector.',
          'Offer pilot program to reduce decision friction.',
        ],
        reminders: [
          'Meeting to proposal should happen within 24 hours.',
          'Proposal to follow-up should happen within 48 hours.',
        ],
        marketInsights: [
          'Moroccan decision makers often require follow-up with clarity and respect.',
        ],
        actionPlan: [
          'Identify stalled stage.',
          'Build close plan.',
          'Call decision maker.',
          'Send revised proposal.',
        ],
      }

    case 'market':
      return {
        ...base,
        executiveSummary: `Morocco market opportunity report for ${sectorName}. Focus is local buyer psychology, trust, partner categories and realistic expansion strategy.`,
        alerts: [
          'Do not use generic international wording without Moroccan operational proof.',
          'Trust, reputation and clarity are decisive in the local market.',
        ],
        congratulations: [
          'ANGELCARE positioning can be powerful if translated into local buyer logic.',
        ],
        coaching: [
          'Lead with reassurance, professionalism and practical outcomes.',
          'Use examples that match Moroccan premium family realities.',
        ],
        revenueMoves: [
          'Start with hotels/events for faster pain recognition.',
          'Develop clinics/schools for trust-based recurring channels.',
          'Approach corporates through HR productivity and employee well-being.',
        ],
        reminders: [
          'Local credibility must be built before scale.',
          'Partnerships require persistence and proof.',
        ],
        marketInsights: [
          'Rabat-Salé-Temara premium segments are relationship-driven.',
          'Hotels and events can create fast proof.',
          'Clinics and schools require slower but deeper trust.',
          'Corporates need HR and productivity framing.',
        ],
        actionPlan: [
          'Pick one sector beachhead.',
          'Create local proof message.',
          'Target decision makers.',
          'Pilot with one credible partner.',
        ],
      }

    case 'partnerScorecard':
    case 'audit':
    case 'agent':
    default:
      return {
        ...base,
        executiveSummary: `Controller intelligence report for ${sectorName}. Focus is account quality, auditability, manager advice, coaching and next execution moves.`,
        alerts: [
          'Weak documentation reduces auditability and management control.',
          'Every report should convert into decisions and tasks.',
        ],
        congratulations: [
          'The system is now building a management memory.',
          'Generated reports can support accountability and coaching.',
        ],
        coaching: [
          'Use reports as a command tool, not archive documents.',
          'Push users to act, not only read dashboards.',
        ],
        revenueMoves: [
          'Use scorecards to focus on highest-potential partners.',
          'Generate proposal follow-ups from report action plans.',
        ],
        reminders: [
          'Every generated report needs a reference.',
          'Every manager note should lead to a next action.',
        ],
        marketInsights: [
          'High-quality reporting improves seriousness with premium partners and internal teams.',
        ],
        actionPlan: [
          'Review high-fit accounts.',
          'Score priority.',
          'Assign next action.',
          'Generate follow-up proposal or meeting.',
        ],
      }
  }
}

function generateReport(params: {
  purpose: ReportPurpose
  sector: SectorKey
  prospects: AnyRow[]
  tasks: AnyRow[]
  meetings: AnyRow[]
  proposals: AnyRow[]
  programs: AnyRow[]
}): ReportRecord {
  const { purpose, sector, prospects, tasks, meetings, proposals, programs } = params
  const filteredProspects = sector === 'all'
    ? prospects
    : prospects.filter((p) => String(p.sector || p.segment || '').toLowerCase().includes(sector))

  const activeProspects = filteredProspects.length || prospects.length
  const openTasks = tasks.filter((t) => !String(t.status || '').toLowerCase().includes('done')).length
  const proposalCount = proposals.length
  const meetingCount = meetings.length
  const programCount = programs.length

  const meetingRate = activeProspects ? Math.round((meetingCount / Math.max(activeProspects, 1)) * 100) : 0
  const proposalRate = activeProspects ? Math.round((proposalCount / Math.max(activeProspects, 1)) * 100) : 0

  const intelligence = templateIntelligence(purpose, sector, {
    activeProspects,
    openTasks,
    proposalCount,
    meetingCount,
    programCount,
    meetingRate,
    proposalRate,
  })

  return {
    id: `report-${Date.now()}`,
    reference: refFor(purpose, sector),
    purpose,
    sector,
    title: `${purposeLabel(purpose)} — ${sectorLabel(sector)}`,
    period: `Generated ${todayFr()}`,
    status: 'Generated',
    generatedAt: new Date().toISOString(),
    owner: 'ANGELCARE Controller Agent',
    executiveSummary: intelligence.executiveSummary,
    alerts: intelligence.alerts,
    congratulations: intelligence.congratulations,
    coaching: intelligence.coaching,
    revenueMoves: intelligence.revenueMoves,
    reminders: intelligence.reminders,
    marketInsights: intelligence.marketInsights,
    kpis: [
      { label: 'Prospects scanned', value: String(activeProspects), interpretation: activeProspects > 20 ? 'Good portfolio base' : 'Portfolio needs stronger sourcing' },
      { label: 'Open tasks', value: String(openTasks), interpretation: openTasks > Math.max(8, activeProspects) ? 'Execution pressure is high' : 'Execution pressure is controlled' },
      { label: 'Meetings', value: String(meetingCount), interpretation: meetingRate < 10 ? 'Meeting creation needs acceleration' : 'Meeting rhythm is promising' },
      { label: 'Proposals', value: String(proposalCount), interpretation: proposalRate < 15 ? 'Proposal pipeline is underbuilt' : 'Proposal pipeline is developing' },
      { label: 'Programs', value: String(programCount), interpretation: 'Strategic offer base available for sector pitching' },
    ],
    actionPlan: intelligence.actionPlan,
  }
}

export default function B2BReportsPremiumWorkspace() {
  const [view, setView] = useState<ViewMode>('command')
  const [sector, setSector] = useState<SectorKey>('all')
  const [purpose, setPurpose] = useState<ReportPurpose>('executive')
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [prospects, setProspects] = useState<AnyRow[]>([])
  const [tasks, setTasks] = useState<AnyRow[]>([])
  const [meetings, setMeetings] = useState<AnyRow[]>([])
  const [proposals, setProposals] = useState<AnyRow[]>([])
  const [programs, setPrograms] = useState<AnyRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('angelcare:b2b-reports')
      if (saved) setReports(JSON.parse(saved))
      const savedPrograms = localStorage.getItem('angelcare:b2b-programs')
      if (savedPrograms) setPrograms(JSON.parse(savedPrograms))
    } catch {}
    load()
  }, [])

  function persist(next: ReportRecord[]) {
    setReports(next)
    try { localStorage.setItem('angelcare:b2b-reports', JSON.stringify(next)) } catch {}
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([
        fetchJson('/api/b2b-partnerships/prospects?limit=220'),
        fetchJson('/api/b2b-partnerships/tasks'),
        fetchJson('/api/b2b-partnerships/meetings'),
        fetchJson('/api/b2b-partnerships/proposals'),
      ])

      if (results[0].status === 'fulfilled') setProspects(normalizeArray(results[0].value))
      if (results[1].status === 'fulfilled') setTasks(normalizeArray(results[1].value))
      if (results[2].status === 'fulfilled') setMeetings(normalizeArray(results[2].value))
      if (results[3].status === 'fulfilled') setProposals(normalizeArray(results[3].value))

      const failures = results.filter((r) => r.status === 'rejected').map((r: any) => r.reason?.message).filter(Boolean)
      if (failures.length) setError(failures.slice(0, 2).join(' · '))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sync report engine.')
    } finally {
      setLoading(false)
    }
  }

  function createReport(selectedPurpose = purpose, selectedSector = sector) {
    const report = generateReport({
      purpose: selectedPurpose,
      sector: selectedSector,
      prospects,
      tasks,
      meetings,
      proposals,
      programs,
    })

    const next = [report, ...reports]
    persist(next)
    setSelectedReport(report)
    setModalMode('view')
  }

  function deleteReport(report: ReportRecord) {
    if (!window.confirm('Delete this generated report?')) return
    persist(reports.filter((r) => r.id !== report.id))
    setSelectedReport(null)
    setModalMode(null)
  }

  function openReport(report: ReportRecord) {
    setSelectedReport(report)
    setModalMode('view')
  }

  function printReport() {
    const node = document.querySelector(`.${styles.reportA4Document}`) as HTMLElement | null
    if (!node) {
      setError('Report A4 document is not mounted.')
      return
    }

    const win = window.open('', '_blank', 'width=980,height=1200')
    if (!win) {
      setError('Allow popups to print the report.')
      return
    }

    win.document.open()
    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${selectedReport?.title || 'ANGELCARE B2B Report'}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Calibri, Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
.${styles.reportA4Document} { width: 210mm !important; min-height: 297mm !important; margin: 0 auto !important; padding: 13mm 14mm !important; box-shadow: none !important; border: 0 !important; font-family: Calibri, Arial, Helvetica, sans-serif !important; }
.${styles.a4Header} { display: grid; grid-template-columns: 1fr 60mm; gap: 18px; border-bottom: 3px solid #111827; padding-bottom: 12px; margin-bottom: 12px; }
.${styles.a4Brand} strong { display:block; font-size: 28px; letter-spacing:.16em; font-weight:900; line-height:1; }
.${styles.a4Brand} span { display:block; margin-top:6px; font-size:12px; font-weight:800; }
.${styles.a4Brand} small, .${styles.a4Ref} small { display:block; margin-top:4px; color:#6b7280; font-size:10px; line-height:1.35; }
.${styles.a4Ref} { border-left:4px solid #111827; padding-left:12px; }
.${styles.a4Ref} span, .${styles.a4MetaGrid} span { display:block; color:#6b7280; font-size:8.8px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; margin-bottom:4px; }
.${styles.a4Ref} strong { display:block; margin-top:5px; font-size:11px; line-height:1.25; }
.${styles.a4TitleBlock} { margin:10px 0 12px; padding-bottom:10px; border-bottom:1px solid #d1d5db; }
.${styles.a4TitleBlock} span { display:inline-flex; background:#111827; color:white; padding:5px 8px; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; }
.${styles.a4TitleBlock} h1 { margin:9px 0 6px; font-size:28px; line-height:.98; letter-spacing:-.035em; font-weight:900; }
.${styles.a4TitleBlock} p, p, li { color:#374151; font-size:10.6px; line-height:1.42; }
.${styles.a4MetaGrid} { display:grid; grid-template-columns: repeat(4, 1fr); gap:7px; margin:10px 0 12px; }
.${styles.a4MetaGrid} article { border:1px solid #d1d5db; background:#f9fafb; padding:8px; min-height:58px; }
.${styles.a4MetaGrid} strong { font-size:11px; line-height:1.2; }
.${styles.a4Executive} { border-left:5px solid #111827; background:#f3f4f6; padding:10px 12px; margin:10px 0 12px; }
.${styles.a4TwoCol} { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
.${styles.a4ThreeCol} { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:8px; }
.${styles.a4Section} { border:1px solid #d1d5db; padding:9px; break-inside:avoid; }
h2 { margin:0 0 5px; font-size:13px; font-weight:900; color:#111827; }
ul, ol { margin:4px 0 0; padding-left:16px; }
li { margin-bottom:2px; }
.${styles.a4Footer} { display:flex; justify-content:space-between; border-top:3px solid #111827; margin-top:12px; padding-top:8px; }
.${styles.a4Footer} strong { display:block; font-size:11px; font-weight:900; }
.${styles.a4Footer} span { display:block; color:#6b7280; font-size:8.8px; line-height:1.3; }
.${styles.a4Footer} div:last-child { text-align:right; }
</style>
</head>
<body>${node.outerHTML}<script>window.onload=function(){window.focus();window.print()}</script></body>
</html>`)
    win.document.close()
  }

  const metrics = [
    { label: 'Generated reports', value: reports.length, helper: 'Auditable report records', icon: '📄' },
    { label: 'Prospects', value: prospects.length, helper: 'Portfolio scanned', icon: '🎯' },
    { label: 'Tasks', value: tasks.length, helper: 'Execution load', icon: '✅' },
    { label: 'Meetings', value: meetings.length, helper: 'Commercial rhythm', icon: '🤝' },
    { label: 'Proposals', value: proposals.length, helper: 'Revenue pipeline', icon: '🧾' },
  ]

  const maxSignal = Math.max(prospects.length, tasks.length, meetings.length, proposals.length, programs.length, 1)
  const meetingRate = prospects.length ? Math.round((meetings.length / Math.max(prospects.length, 1)) * 100) : 0
  const proposalRate = prospects.length ? Math.round((proposals.length / Math.max(prospects.length, 1)) * 100) : 0
  const executionPressure = tasks.length ? Math.min(100, Math.round((tasks.length / Math.max(prospects.length || 1, 1)) * 100)) : 0
  const reportDepth = Math.min(100, Math.round((reports.length / 10) * 100))
  const commercialReadiness = Math.min(100, Math.round((meetingRate * .25) + (proposalRate * .35) + (programs.length ? 25 : 0) + (reports.length ? 15 : 0)))

  const signalBars = [
    { label: 'Prospects', value: prospects.length, percent: Math.round((prospects.length / maxSignal) * 100), icon: '🎯' },
    { label: 'Tasks', value: tasks.length, percent: Math.round((tasks.length / maxSignal) * 100), icon: '✅' },
    { label: 'Meetings', value: meetings.length, percent: Math.round((meetings.length / maxSignal) * 100), icon: '🤝' },
    { label: 'Proposals', value: proposals.length, percent: Math.round((proposals.length / maxSignal) * 100), icon: '🧾' },
    { label: 'Programs', value: programs.length, percent: Math.round((programs.length / maxSignal) * 100), icon: '🧭' },
  ]

  const funnelBlocks = [
    { label: 'Portfolio', value: prospects.length, helper: 'Accounts scanned', icon: '01' },
    { label: 'Meetings', value: meetings.length, helper: `${meetingRate}% of portfolio`, icon: '02' },
    { label: 'Proposals', value: proposals.length, helper: `${proposalRate}% of portfolio`, icon: '03' },
    { label: 'Reports', value: reports.length, helper: 'Management outputs', icon: '04' },
  ]

  const controllerCards = [
    { label: 'Commercial readiness', value: commercialReadiness, suffix: '%', helper: commercialReadiness >= 70 ? 'Strong command base' : 'Needs stronger activity conversion' },
    { label: 'Execution pressure', value: executionPressure, suffix: '%', helper: executionPressure >= 80 ? 'High follow-up load' : 'Controlled execution load' },
    { label: 'Proposal intensity', value: proposalRate, suffix: '%', helper: proposalRate >= 15 ? 'Proposal rhythm active' : 'Push more written offers' },
    { label: 'Report depth', value: reportDepth, suffix: '%', helper: reports.length >= 5 ? 'Solid audit trail' : 'Generate more management reports' },
  ]

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>McKinsey-style B2B report engine</span>
          <h1>Controller reports, alerts, coaching & revenue domination intelligence</h1>
          <p>Generate referenced, auditable, sector-aware ANGELCARE reports with manager-agent insights, performance coaching, revenue pushes and Morocco-market commercial logic.</p>
        </div>

        <aside className={styles.heroCommand}>
          <span>System controller</span>
          <strong>{loading ? 'Scanning…' : 'Ready to generate'}</strong>
          <button type="button" onClick={load} disabled={loading}>{loading ? 'Syncing…' : 'Sync live data'}</button>
          <button type="button" className={styles.createButton} onClick={() => createReport()}>Generate report</button>
        </aside>
      </section>

      {error && <section className={styles.warning}><strong>Report sync warning</strong><p>{error}</p></section>}

      <section className={styles.metrics}>
        {metrics.map((metric) => (
          <article key={metric.label}>
            <div>{metric.icon}</div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className={styles.executiveDashboard}>
        <div className={styles.dashboardHero}>
          <div>
            <span>Executive intelligence cockpit</span>
            <h2>{commercialReadiness}% commercial readiness</h2>
            <p>Numbers-first view of the B2B machine: portfolio, execution, meeting creation, proposals, reporting depth and manager-agent priorities.</p>
          </div>
          <aside>
            <strong>{purposeLabel(purpose)}</strong>
            <small>{sectorLabel(sector)}</small>
            <button type="button" onClick={() => createReport()}>Generate from current dashboard</button>
          </aside>
        </div>

        <div className={styles.controllerScoreGrid}>
          {controllerCards.map((card) => (
            <article key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}{card.suffix}</strong>
              <div><i style={{ width: `${Math.max(6, Math.min(100, card.value))}%` }} /></div>
              <p>{card.helper}</p>
            </article>
          ))}
        </div>

        <div className={styles.dashboardGrid}>
          <section className={styles.signalPanel}>
            <div className={styles.miniHeader}>
              <span>Portfolio signals</span>
              <strong>Live distribution</strong>
            </div>
            {signalBars.map((bar) => (
              <div className={styles.signalRow} key={bar.label}>
                <label>{bar.icon} {bar.label}</label>
                <div><i style={{ width: `${Math.max(4, bar.percent)}%` }} /></div>
                <strong>{bar.value}</strong>
              </div>
            ))}
          </section>

          <section className={styles.funnelPanel}>
            <div className={styles.miniHeader}>
              <span>Commercial funnel</span>
              <strong>Board-style conversion</strong>
            </div>
            <div className={styles.funnelGrid}>
              {funnelBlocks.map((block) => (
                <article key={block.label}>
                  <em>{block.icon}</em>
                  <strong>{block.value}</strong>
                  <span>{block.label}</span>
                  <p>{block.helper}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.alertPanel}>
            <div className={styles.miniHeader}>
              <span>Controller push</span>
              <strong>Next management instruction</strong>
            </div>
            <article>
              <h3>{proposalRate < 15 ? 'Increase proposal output' : meetingRate < 10 ? 'Increase meeting creation' : 'Protect closing discipline'}</h3>
              <p>{proposalRate < 15 ? 'The dashboard indicates insufficient written offers versus portfolio size. Push sector-specific proposals within 48 hours.' : meetingRate < 10 ? 'The dashboard indicates low meeting conversion. Prioritize decision-maker calls and WhatsApp follow-ups.' : 'The system has traction. Protect follow-up rhythm and convert proposals into signed partnerships.'}</p>
            </article>
          </section>
        </div>
      </section>

      <section className={styles.navbar}>
        {(['command', 'templates', 'generated', 'controller', 'print'] as ViewMode[]).map((item) => (
          <button key={item} className={view === item ? styles.activeView : ''} onClick={() => setView(item)}>
            {item === 'command' ? 'Command Center' : item === 'templates' ? 'Templates' : item === 'generated' ? 'Generated Reports' : item === 'controller' ? 'Controller Agent' : 'A4 Print Studio'}
          </button>
        ))}
      </section>

      <section className={styles.sectorNav}>
        {SECTORS.map((item) => (
          <button key={item.key} className={sector === item.key ? styles.activeSector : ''} onClick={() => setSector(item.key)}>
            <strong>{item.icon}</strong><span>{item.label}</span>
          </button>
        ))}
      </section>

      <section className={styles.builderBar}>
        <div>
          <span>Report generator</span>
          <h2>{purposeLabel(purpose)} · {sectorLabel(sector)}</h2>
          <p>Choose a purpose and sector, then generate a referenced report for audit, management and commercial execution.</p>
        </div>
        <div>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value as ReportPurpose)}>
            {TEMPLATES.map((t) => <option key={t.purpose} value={t.purpose}>{t.title}</option>)}
          </select>
          <select value={sector} onChange={(e) => setSector(e.target.value as SectorKey)}>
            {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={() => createReport()}>Generate now</button>
        </div>
      </section>

      {view === 'templates' && (
        <section className={styles.templateGrid}>
          {TEMPLATES.map((template) => (
            <article key={template.purpose} onClick={() => { setPurpose(template.purpose); createReport(template.purpose, sector) }}>
              <div>{template.icon}</div>
              <h3>{template.title}</h3>
              <p>{template.description}</p>
              <section className={styles.templateStats}>
                <strong>1 page</strong>
                <strong>Ref</strong>
                <strong>KPI</strong>
                <strong>A4</strong>
              </section>
              <span>{template.bestFor}</span>
              <button type="button">Generate template</button>
            </article>
          ))}
        </section>
      )}

      {(view === 'command' || view === 'generated' || view === 'print') && (
        <section className={styles.layout}>
          <div className={styles.reportPanel}>
            <div className={styles.panelHeader}>
              <span>Generated report library</span>
              <h2>Auditable reports</h2>
              <p>Every generated report includes a unique reference, controller insights, alerts, coaching, revenue moves and a printable consulting-style A4 document.</p>
            </div>

            <div className={styles.reportGrid}>
              {reports.map((report) => (
                <article key={report.id} className={styles.reportCard} onClick={() => openReport(report)}>
                  <div className={styles.reportTop}>
                    <div>{TEMPLATES.find((t) => t.purpose === report.purpose)?.icon || '📄'}</div>
                    <span>{report.status}</span>
                  </div>
                  <h3>{report.title}</h3>
                  <p>{report.executiveSummary}</p>
                  <div className={styles.chips}>
                    <span>{report.reference}</span>
                    <span>{sectorLabel(report.sector)}</span>
                    <span>{report.period}</span>
                  </div>
                  <div className={styles.reportFooter}>
                    <button onClick={(e) => { e.stopPropagation(); openReport(report) }}>Open report</button>
                    <strong>{report.owner}</strong>
                  </div>
                </article>
              ))}

              {!reports.length && (
                <article className={styles.emptyState}>
                  <div>📄</div>
                  <h3>No reports generated yet</h3>
                  <p>Generate your first executive, weekly, revenue, risk or controller-agent report.</p>
                </article>
              )}
            </div>
          </div>

          <aside className={styles.commandPanel}>
            <div className={styles.panelHeader}>
              <span>Controller agent behavior</span>
              <h2>Management intelligence</h2>
              <p>The report controller pushes discipline, congratulates wins, flags risk and recommends revenue actions.</p>
            </div>

            <div className={styles.commandList}>
              <article><div>🚨</div><h3>Alert</h3><p>Flags weak follow-up, low proposal activity and missing next actions.</p></article>
              <article><div>👏</div><h3>Congratulate</h3><p>Recognizes progress and keeps team morale high.</p></article>
              <article><div>💪</div><h3>Coach</h3><p>Pushes ownership, activity rhythm and decision-maker discipline.</p></article>
              <article><div>🚀</div><h3>Revenue push</h3><p>Recommends immediate moves to increase pipeline and close opportunities.</p></article>
              <article><div>🇲🇦</div><h3>Morocco logic</h3><p>Uses trust, sector fit, relationship building and premium positioning.</p></article>
            </div>
          </aside>
        </section>
      )}

      {view === 'controller' && (
        <section className={styles.controllerPanel}>
          <div className={styles.panelHeader}>
            <span>System controller and manager agent</span>
            <h2>Live operating doctrine</h2>
            <p>This agent is designed to push the B2B team toward disciplined execution and continuous revenue growth.</p>
          </div>
          <div className={styles.controllerGrid}>
            <article><h3>Daily command</h3><p>Every day must create new contacts, follow-ups, meetings or proposal movement.</p></article>
            <article><h3>Revenue obsession</h3><p>No attractive prospect should stay passive without a next action, owner and deadline.</p></article>
            <article><h3>Moroccan market fit</h3><p>Lead with trust, professional seriousness, family comfort and sector-specific value.</p></article>
            <article><h3>Performance culture</h3><p>Congratulate real wins, but push higher standards immediately after.</p></article>
          </div>
        </section>
      )}

      {modalMode && selectedReport && (
        <div className={styles.modalBackdrop}>
          <section className={styles.reportModal}>
            <div className={styles.modalHeader}>
              <div>
                <span>Referenced report dossier</span>
                <h2>{selectedReport.title}</h2>
                <p>{selectedReport.reference} · {selectedReport.period}</p>
              </div>
              <button onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className={styles.reportDetailGrid}>
              <Dossier title="Alerts" items={selectedReport.alerts} tone="alert" />
              <Dossier title="Congratulations" items={selectedReport.congratulations} tone="win" />
              <Dossier title="Coaching" items={selectedReport.coaching} tone="coach" />
              <Dossier title="Revenue moves" items={selectedReport.revenueMoves} tone="revenue" />
              <Dossier title="Reminders" items={selectedReport.reminders} />
              <Dossier title="Morocco market insights" items={selectedReport.marketInsights} />
              <Dossier title="Action plan" items={selectedReport.actionPlan} />
            </div>

            <aside className={styles.reportA4Preview}>
              <ReportA4 report={selectedReport} />
            </aside>

            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={() => setModalMode(null)}>Close</button>
              <button className={styles.printButton} onClick={printReport}>Print A4 report</button>
              <button className={styles.deleteButton} onClick={() => deleteReport(selectedReport)}>Delete report</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function Dossier({ title, items, tone = '' }: { title: string; items: string[]; tone?: string }) {
  return (
    <section className={`${styles.dossier} ${tone ? styles[tone] : ''}`}>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  )
}

function ReportA4({ report }: { report: ReportRecord }) {
  return (
    <div className={styles.reportA4Document}>
      <header className={styles.a4Header}>
        <div className={styles.a4Brand}>
          <strong>ANGELCARE</strong>
          <span>B2B Partnerships · Controller Intelligence Office</span>
          <small>Strategic report · Audit reference · Commercial execution · Morocco market logic</small>
        </div>
        <div className={styles.a4Ref}>
          <span>Report reference</span>
          <strong>{report.reference}</strong>
          <small>{report.period}</small>
        </div>
      </header>

      <section className={styles.a4TitleBlock}>
        <span>Confidential management report</span>
        <h1>{report.title}</h1>
        <p>{report.executiveSummary}</p>
      </section>

      <section className={styles.a4MetaGrid}>
        <article><span>Purpose</span><strong>{purposeLabel(report.purpose)}</strong></article>
        <article><span>Sector</span><strong>{sectorLabel(report.sector)}</strong></article>
        <article><span>Owner</span><strong>{report.owner}</strong></article>
        <article><span>Status</span><strong>{report.status}</strong></article>
      </section>

      <section className={styles.a4Executive}>
        <h2>Controller diagnosis</h2>
        <p>{report.alerts[0]} {report.coaching[0]}</p>
      </section>

      <div className={styles.a4ThreeCol}>
        <A4List title="Alerts" items={report.alerts.slice(0, 4)} />
        <A4List title="Congratulations" items={report.congratulations.slice(0, 3)} />
        <A4List title="Revenue moves" items={report.revenueMoves.slice(0, 4)} />
      </div>

      <div className={styles.a4TwoCol}>
        <A4List title="Coaching guidance" items={report.coaching.slice(0, 4)} />
        <A4List title="Morocco market insights" items={report.marketInsights.slice(0, 4)} />
      </div>

      <div className={styles.a4ThreeCol}>
        <A4List title="KPIs" items={report.kpis.map((k) => `${k.label}: ${k.value} — ${k.interpretation}`).slice(0, 5)} />
        <A4List title="Reminders" items={report.reminders.slice(0, 4)} />
        <A4List title="Action plan" items={report.actionPlan.slice(0, 5)} ordered />
      </div>

      <footer className={styles.a4Footer}>
        <div>
          <strong>ANGELCARE · B2B Report Engine</strong>
          <span>Generated by system controller for management action and audit traceability.</span>
        </div>
        <div>
          <span>{report.reference}</span>
          <span>Single-page A4 report</span>
        </div>
      </footer>
    </div>
  )
}

function A4List({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <section className={styles.a4Section}>
      <h2>{title}</h2>
      <Tag>{items.map((item) => <li key={item}>{item}</li>)}</Tag>
    </section>
  )
}
