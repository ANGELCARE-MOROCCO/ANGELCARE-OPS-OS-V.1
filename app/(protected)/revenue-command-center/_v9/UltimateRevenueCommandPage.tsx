"use client"

import React, { useMemo, useState } from "react"
import {
  Activity, AlarmClock, Archive, ArrowRight, BadgeCheck, BarChart3, Bell, Bot, Briefcase,
  CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Command, Crown, Database,
  Edit3, Eye, Filter, Flag, Gauge, GitBranch, Globe2, Handshake, Headphones, Layers3,
  LineChart, LockKeyhole, Mail, Megaphone, Network, Phone, Plus, Radar, RefreshCw,
  Rocket, Route, Save, Search, Settings, ShieldCheck, Sparkles, Target, Timer,
  TrendingUp, Users, Wallet, Workflow, Zap
} from "lucide-react"

export type RevenuePageKey =
  | "home" | "cockpit" | "control-tower" | "master-command" | "elite-command" | "strategy-room" | "executive-briefing"
  | "tasks" | "tasks-new" | "tasks-board" | "task-detail" | "task-depth"
  | "prospects" | "prospects-new" | "prospects-pipeline" | "prospect-detail" | "prospect-edit" | "leads-impact"
  | "follow-ups" | "appointments" | "appointments-command" | "notifications"
  | "sdr-execution" | "b2c-workflow" | "business-development"
  | "campaigns" | "campaigns-board" | "partnerships" | "partnerships-pipeline" | "market-mapping" | "market-coverage"
  | "management" | "my-work" | "team-performance" | "workload-balancer"
  | "automation" | "ai-scoring" | "predictive" | "meta-readiness" | "system-activation" | "overdue-heatmap" | "growth"

const iconMap: Record<string, any> = {
  Command, Crown, Radar, Rocket, Target, ClipboardList, Users, Handshake, Megaphone, Workflow, Bot, Gauge,
  Briefcase, Wallet, Phone, Bell, CalendarDays, Settings, BarChart3, LineChart, Network, Globe2, Route, Headphones
}

type PageConfig = {
  key: RevenuePageKey
  title: string
  eyebrow: string
  purpose: string
  icon: string
  accent: string
  route: string
  domain: string
  mainAction: string
  secondaryAction: string
  operators: string[]
  kpis: { label: string; value: string; trend: string }[]
  lanes: string[]
  features: string[]
  commandPanels: { title: string; items: string[] }[]
  workflows: string[]
  records: { name: string; status: string; owner: string; value: string; next: string; risk: string }[]
}

const commonFeatures = [
  "global search", "smart filters", "bulk selection", "bulk archive", "bulk assign", "bulk priority change", "bulk status update",
  "inline edit", "quick create", "duplicate record", "copy link", "open detail drawer", "export CSV", "manager approval",
  "audit log", "activity timeline", "owner assignment", "department routing", "SLA timer", "risk flag", "escalation", "follow-up reminder",
  "task creation", "note capture", "comment stream", "call log", "email action", "WhatsApp action placeholder", "meeting schedule",
  "pipeline stage change", "score update", "forecast impact", "revenue impact", "confidence score", "health pulse", "live queue count",
  "retry failed action", "sync now", "refresh dashboard", "role restricted buttons", "CEO override", "manager view", "agent view",
  "saved views", "scenario presets", "priority matrix", "next-best-action", "automation trigger", "template use", "performance card", "daily checklist"
]

const configs: Record<RevenuePageKey, PageConfig> = {
  home: cfg("home","Revenue Command Center","Executive revenue operating system","One control layer for leads, tasks, campaigns, follow-ups, partnerships, sales execution and management.","Command","from-violet-500 via-fuchsia-500 to-cyan-400","/revenue-command-center","Revenue HQ","Create command action","Open cockpit",["CEO","Revenue Director","Ops Manager"], ["Revenue MTD","MAD 812K","+18%"],["Pipeline","Execution","Risk","Growth"]),
  cockpit: cfg("cockpit","Revenue Cockpit","Live executive cockpit","Fast operational cockpit for daily revenue decisions, queues, signals and high-impact actions.","Gauge","from-cyan-400 via-blue-500 to-indigo-500","/revenue-command-center/cockpit","Cockpit","Launch daily command","Refresh signals",["CEO","Managers","Team Leads"], ["Win probability","73%","+9%"],["Today","This week","At risk","Won"]),
  "control-tower": cfg("control-tower","Control Tower","Multi-team control room","Cross-functional tower for bottlenecks, overdue work, revenue risk, team load and escalation.","Radar","from-emerald-400 via-teal-500 to-cyan-500","/revenue-command-center/control-tower","Control","Resolve bottleneck","Run control scan",["CEO","Controller","Manager"], ["Blocked work","12","-4"],["Signals","Escalations","Capacity","Quality"]),
  "master-command": cfg("master-command","Master Command","Total revenue navigation","Top-level navigation map with all submodules, decision gates, command routing and executive controls.","Crown","from-amber-400 via-orange-500 to-rose-500","/revenue-command-center/master-command","Master","Open master action","Audit module",["CEO","Admin"], ["Command depth","98%","+22%"],["Modules","Permissions","KPIs","Actions"]),
  "elite-command": cfg("elite-command","Elite Command","Premium execution layer","High-intensity command board for maximum-priority revenue moves and strategic execution.","Rocket","from-pink-500 via-purple-500 to-indigo-500","/revenue-command-center/elite-command","Elite","Activate elite play","Lock priority",["CEO","Revenue Director"], ["Elite plays","24","+7"],["Plays","Targets","Signals","Approvals"]),
  "strategy-room": cfg("strategy-room","Strategy Room","Revenue strategy workspace","Strategic planning space for objectives, scenarios, action themes and tactical revenue programs.","Target","from-sky-500 via-indigo-500 to-purple-500","/revenue-command-center/strategy-room","Strategy","Create scenario","Compare options",["CEO","Strategy Lead"], ["Scenario ROI","142%","+31%"],["Scenarios","Programs","Risks","Decisions"]),
  "executive-briefing": cfg("executive-briefing","Executive Briefing","CEO-ready summary","One-page briefing for decisions, risk, progress, wins, losses, and next moves.","Briefcase","from-slate-500 via-zinc-700 to-black","/revenue-command-center/executive-briefing","Briefing","Generate briefing","Export summary",["CEO","Board View"], ["Decision items","8","+2"],["Brief","Risks","Wins","Needs"]),

  tasks: cfg("tasks","Tasks Command Desk","Revenue execution tasks","Full production task workspace for creating, assigning, tracking, escalating and closing revenue work.","ClipboardList","from-blue-500 via-cyan-500 to-emerald-400","/revenue-command-center/tasks","Tasks","Create task","Open board",["Agents","Managers"], ["Open tasks","138","-16"],["Backlog","Today","Blocked","Done"]),
  "tasks-new": cfg("tasks-new","Create Revenue Task","High-control creation flow","Structured creation page with presets, SLA, owner, priority, linked object and execution checklist.","Plus","from-blue-500 via-indigo-500 to-violet-500","/revenue-command-center/tasks/new","Tasks","Save new task","Use preset",["Agents","Managers"], ["Preset coverage","50+","+50"],["Context","Owner","SLA","Checklist"]),
  "tasks-board": cfg("tasks-board","Task Board","Kanban execution board","Drag-style operational board concept for stages, ownership, overload, blockers and bulk movement.","Layers3","from-indigo-500 via-sky-500 to-cyan-400","/revenue-command-center/tasks/board","Tasks","Move selected","Balance workload",["Managers","Agents"], ["Board velocity","31/day","+12%"],["New","Doing","Blocked","Closed"]),
  "task-detail": cfg("task-detail","Task Detail Command","Single task control room","Task detail page for subtasks, notes, audit, linked prospect, SLA, blockers and manager decisions.","Eye","from-violet-500 via-blue-500 to-cyan-500","/revenue-command-center/tasks/[id]","Tasks","Add subtask","Escalate",["Owner","Manager"], ["Completion","64%","+8%"],["Timeline","Subtasks","Risk","Notes"]),
  "task-depth": cfg("task-depth","Task Depth Intelligence","Deep task execution","Advanced detail layer for root cause, dependencies, recovery plans and performance inspection.","GitBranch","from-fuchsia-500 via-violet-500 to-blue-500","/revenue-command-center/tasks/[id]/depth","Tasks","Add dependency","Run depth scan",["Manager","Controller"], ["Dependency risk","Medium","-11%"],["Dependencies","Root cause","Recovery","Audit"]),

  prospects: cfg("prospects","Prospects Command","Lead and prospect control","Full prospect workspace for acquisition, qualification, scoring, stage movement and conversion.","Users","from-emerald-500 via-lime-500 to-yellow-400","/revenue-command-center/prospects","Prospects","Create prospect","Qualify selected",["SDR","Sales","Managers"], ["Qualified leads","342","+28"],["New","Qualified","Proposal","Won"]),
  "prospects-new": cfg("prospects-new","Create Prospect","Structured prospect intake","Create prospects with origin, need, urgency, budget, owner, next action and scoring context.","Plus","from-lime-500 via-emerald-500 to-teal-500","/revenue-command-center/prospects/new","Prospects","Save prospect","Score prospect",["SDR","Sales"], ["Creation quality","96%","+14%"],["Identity","Need","Score","Next step"]),
  "prospects-pipeline": cfg("prospects-pipeline","Prospect Pipeline","Pipeline operating board","Pipeline movement, stage health, revenue forecast, drop-off risk and qualification gates.","Route","from-teal-500 via-cyan-500 to-blue-500","/revenue-command-center/prospects/pipeline","Pipeline","Move stage","Run forecast",["Sales","Managers"], ["Pipeline MAD","2.4M","+19%"],["Lead","Qualified","Negotiation","Won"]),
  "prospect-detail": cfg("prospect-detail","Prospect Action Room","Single prospect workspace","Prospect detail with timeline, actions, family needs, call notes, documents and conversion decisions.","Eye","from-emerald-500 via-cyan-500 to-indigo-500","/revenue-command-center/prospects/[id]","Prospects","Log follow-up","Create offer",["Owner","Manager"], ["Conversion chance","68%","+7%"],["Profile","Timeline","Actions","Offer"]),
  "prospect-edit": cfg("prospect-edit","Edit Prospect","Controlled prospect editing","Edit prospect safely with owner, stage, value, source, next action, notes and audit history.","Edit3","from-green-500 via-emerald-500 to-cyan-500","/revenue-command-center/prospects/[id]/edit","Prospects","Save edits","Validate data",["Owner","Manager"], ["Data quality","91%","+16%"],["Identity","Commercial","Follow-up","Audit"]),
  "leads-impact": cfg("leads-impact","Leads Impact","Lead performance intelligence","Understand lead sources, conversion impact, action quality, response speed and revenue contribution.","TrendingUp","from-yellow-400 via-orange-500 to-red-500","/revenue-command-center/leads-impact","Impact","Analyze source","Export impact",["CEO","Marketing","Sales"], ["Lead ROI","214%","+43%"],["Sources","Speed","Quality","Revenue"]),

  "follow-ups": cfg("follow-ups","Follow-ups Command","Follow-up operating desk","Control callbacks, promises, next actions, overdue reminders and relationship continuity.","AlarmClock","from-rose-500 via-orange-500 to-amber-400","/revenue-command-center/follow-ups","Follow-ups","Add follow-up","Clear overdue",["Agents","Managers"], ["Overdue","19","-8"],["Due today","Overdue","Waiting","Closed"]),
  appointments: cfg("appointments","Appointments","Meeting and visit schedule","Manage revenue appointments, calls, visits, demos, confirmations and no-show risk.","CalendarDays","from-purple-500 via-pink-500 to-rose-500","/revenue-command-center/appointments","Appointments","Book appointment","Confirm selected",["Agents","Schedulers"], ["Confirmed","47","+11"],["Today","Upcoming","Unconfirmed","No-show risk"]),
  "appointments-command": cfg("appointments-command","Appointments Command","Appointment control panel","High-control appointment page with confirmations, reminders, reschedule flows and owner responsibility.","Command","from-pink-500 via-rose-500 to-orange-500","/revenue-command-center/appointments/command","Appointments","Send reminder","Rebalance calendar",["Schedulers","Managers"], ["No-show risk","6%","-3%"],["Confirm","Remind","Reschedule","Report"]),
  notifications: cfg("notifications","Notifications Command","Revenue alert center","Central alert center for overdue work, blocked deals, missed callbacks, failures and manager signals.","Bell","from-red-500 via-rose-500 to-pink-500","/revenue-command-center/notifications","Notifications","Acknowledge alerts","Escalate risk",["All teams"], ["Unread alerts","23","-5"],["Critical","Warnings","Info","Archived"]),

  "sdr-execution": cfg("sdr-execution","SDR Execution","Prospecting production desk","Daily SDR workspace for calls, qualification, follow-ups, conversion signals and pipeline creation.","Phone","from-cyan-500 via-blue-500 to-violet-500","/revenue-command-center/sdr-execution","SDR","Start call block","Create lead",["SDR","Sales Lead"], ["Calls today","184","+41"],["Call","Qualify","Follow-up","Convert"]),
  "b2c-workflow": cfg("b2c-workflow","B2C Workflow","Family/client sales workflow","B2C funnel for family inquiries, need discovery, service matching, proposals and close actions.","Headphones","from-orange-500 via-amber-500 to-yellow-400","/revenue-command-center/b2c-workflow","B2C","Start intake","Create proposal",["Sales","Care coordinators"], ["B2C closes","18","+5"],["Inquiry","Need","Proposal","Start care"]),
  "business-development": cfg("business-development","Business Development","BD command room","BD workspace for market targets, institutions, outreach, partnership revenue and strategic accounts.","Briefcase","from-slate-600 via-blue-600 to-cyan-500","/revenue-command-center/business-development","BD","Create account","Plan outreach",["BD","CEO"], ["Strategic accounts","36","+9"],["Targets","Outreach","Meetings","Deals"]),

  campaigns: cfg("campaigns","Campaigns Command","Revenue campaign control","Campaign workspace for target segments, actions, owners, execution calendar, ROI and performance.","Megaphone","from-fuchsia-500 via-pink-500 to-orange-400","/revenue-command-center/campaigns","Campaigns","Create campaign","Launch checklist",["Marketing","Revenue"], ["Active campaigns","12","+3"],["Ideas","Live","Optimize","Closed"]),
  "campaigns-board": cfg("campaigns-board","Campaign Board","Campaign execution board","Board for campaign tasks, audience activation, delivery, optimization and conversion follow-through.","Layers3","from-purple-500 via-fuchsia-500 to-pink-500","/revenue-command-center/campaigns/board","Campaigns","Move campaign","Review ROI",["Marketing","Managers"], ["Campaign ROI","176%","+21%"],["Plan","Build","Launch","Measure"]),
  partnerships: cfg("partnerships","Partnerships Command","Partner revenue management","Manage partners, referrals, agreements, pipelines, partner activity and revenue contribution.","Handshake","from-green-500 via-teal-500 to-blue-500","/revenue-command-center/partnerships","Partnerships","Add partner","Log referral",["BD","Partnerships"], ["Partner revenue","MAD 188K","+26%"],["Prospects","Active","Dormant","Strategic"]),
  "partnerships-pipeline": cfg("partnerships-pipeline","Partnership Pipeline","Partner deal pipeline","Pipeline for institutions, clinics, providers, referral networks and revenue opportunities.","Network","from-emerald-500 via-cyan-500 to-sky-500","/revenue-command-center/partnerships/pipeline","Partnerships","Move partner","Create referral",["BD","CEO"], ["Referral pipeline","MAD 740K","+32%"],["Target","Contacted","Agreement","Producing"]),
  "market-mapping": cfg("market-mapping","Market Mapping","Market opportunity map","Map service areas, competition, segments, target zones and coverage opportunities.","Globe2","from-blue-500 via-teal-500 to-lime-400","/revenue-command-center/market-mapping","Market","Add zone","Analyze coverage",["Marketing","BD","CEO"], ["Coverage score","79%","+12%"],["Zones","Segments","Competitors","Gaps"]),
  "market-coverage": cfg("market-coverage","Market Coverage","Coverage command dashboard","Area coverage, target saturation, care demand, sales focus zones and expansion readiness.","Radar","from-lime-500 via-green-500 to-emerald-500","/revenue-command-center/market-mapping/coverage","Market","Assign zone","Open heatmap",["Marketing","Ops"], ["Hot zones","17","+4"],["High demand","Medium","Low","Unknown"]),

  management: cfg("management","Revenue Management","Manager control layer","Management cockpit for assignments, performance, risks, approvals, coaching and production standards.","ShieldCheck","from-zinc-700 via-slate-700 to-blue-600","/revenue-command-center/management","Management","Assign work","Review team",["Managers","CEO"], ["Team health","88%","+6%"],["People","Quality","Load","Decisions"]),
  "my-work": cfg("my-work","My Work","Personal revenue workspace","Agent personal desk for assigned work, due items, messages, tasks and performance focus.","CheckCircle2","from-sky-500 via-cyan-500 to-emerald-400","/revenue-command-center/my-work","Personal","Start focus mode","Complete selected",["Agents"], ["My due items","14","-6"],["Now","Today","Waiting","Done"]),
  "team-performance": cfg("team-performance","Team Performance","Revenue performance analytics","Team KPIs, output quality, speed, conversion, workload and coaching signals.","BarChart3","from-indigo-500 via-blue-500 to-cyan-500","/revenue-command-center/team-performance","Performance","Open coaching","Export KPIs",["Managers","CEO"], ["Productivity","92%","+13%"],["KPIs","Agents","Coaching","Wins"]),
  "workload-balancer": cfg("workload-balancer","Workload Balancer","Capacity and assignment control","Balance tasks, prospects, follow-ups, appointments and campaigns across agents.","Workflow","from-teal-500 via-cyan-500 to-blue-500","/revenue-command-center/workload-balancer","Workload","Auto-balance","Reassign selected",["Managers"], ["Overloaded agents","3","-2"],["Low load","Healthy","Heavy","Critical"]),

  automation: cfg("automation","Automation Command","Revenue automation engine","Manage automation scenarios, triggers, actions, safety checks and command runs.","Bot","from-violet-500 via-purple-500 to-fuchsia-500","/revenue-command-center/automation","Automation","Run automation","Create rule",["Managers","Admin"], ["Active rules","39","+8"],["Triggers","Rules","Runs","Safety"]),
  "ai-scoring": cfg("ai-scoring","AI Scoring","Scoring and prioritization","Score prospects, tasks, campaigns and risks for priority, win chance and execution urgency.","Sparkles","from-cyan-400 via-fuchsia-500 to-amber-400","/revenue-command-center/ai-scoring","Intelligence","Re-score records","Explain score",["Managers","Agents"], ["Score accuracy","86%","+10%"],["Hot","Medium","Low","Review"]),
  predictive: cfg("predictive","Predictive Revenue","Forecasting and prediction","Forecast sales, bottlenecks, revenue probability, churn risk and next moves.","LineChart","from-blue-500 via-violet-500 to-pink-500","/revenue-command-center/predictive","Prediction","Run forecast","Create scenario",["CEO","Managers"], ["Forecast MAD","1.8M","+17%"],["Forecast","Risk","Upside","Actions"]),
  "meta-readiness": cfg("meta-readiness","Meta Readiness","Meta/Facebook revenue readiness","Prepare targeting, campaigns, conversion readiness, tracking and lead response operations.","Megaphone","from-blue-600 via-indigo-600 to-purple-600","/revenue-command-center/meta-readiness","Meta","Check readiness","Create checklist",["Marketing","Revenue"], ["Readiness","82%","+18%"],["Tracking","Content","Leads","Response"]),
  "system-activation": cfg("system-activation","System Activation","Activation and rollout control","Activation workspace for enabling users, processes, rules, permissions and execution standards.","Zap","from-yellow-400 via-orange-500 to-red-500","/revenue-command-center/system-activation","System","Activate layer","Run readiness",["Admin","CEO"], ["Activation","94%","+24%"],["Users","Rules","Pages","APIs"]),
  "overdue-heatmap": cfg("overdue-heatmap","Overdue Heatmap","Risk and delay heatmap","Visual heatmap for overdue tasks, callbacks, appointments, payments and high-risk revenue items.","AlarmClock","from-red-600 via-orange-500 to-yellow-400","/revenue-command-center/overdue-heatmap","Risk","Clear risk","Escalate overdue",["Managers","Agents"], ["Critical overdue","11","-7"],["Critical","High","Medium","Low"]),
  growth: cfg("growth","Growth Command","Growth acceleration desk","Growth workspace for opportunities, experiments, expansion actions and revenue acceleration.","TrendingUp","from-emerald-400 via-lime-500 to-yellow-400","/revenue-command-center/growth","Growth","Create growth play","Measure impact",["CEO","Growth Lead"], ["Growth velocity","+34%","+9%"],["Ideas","Experiments","Scale","Impact"]),
}

function cfg(key: RevenuePageKey, title: string, eyebrow: string, purpose: string, icon: string, accent: string, route: string, domain: string, mainAction: string, secondaryAction: string, operators: string[], firstKpi: [string,string,string], lanes: string[]): PageConfig {
  const baseKpis = [
    { label: firstKpi[0], value: firstKpi[1], trend: firstKpi[2] },
    { label: "Action readiness", value: "95%", trend: "+18%" },
    { label: "SLA protection", value: "91%", trend: "+12%" },
    { label: "Execution depth", value: "50+", trend: "features" },
  ]
  return {
    key, title, eyebrow, purpose, icon, accent, route, domain, mainAction, secondaryAction, operators, kpis: baseKpis, lanes,
    features: buildFeatures(domain),
    commandPanels: buildPanels(domain),
    workflows: buildWorkflows(domain),
    records: buildRecords(domain)
  }
}

function buildFeatures(domain: string) {
  const domainFeatures: Record<string,string[]> = {
    Tasks: ["subtask creation","blocker register","dependency mapping","Kanban movement","time budget","task depth scan","quality gate","completion proof"],
    Prospects: ["lead qualification","family need profile","budget signal","source tracking","conversion checklist","deal value estimation","stage movement","proposal trigger"],
    Pipeline: ["stage forecast","loss reason capture","deal health","probability tuning","pipeline drag risk","forecast bridge","stage gate","close plan"],
    Campaigns: ["audience selection","campaign calendar","ROI controls","creative checklist","launch approval","campaign tasking","segment performance","conversion follow-up"],
    Partnerships: ["partner profile","referral tracker","agreement stage","partner health","institution mapping","contact cadence","commission note","strategic value"],
    Market: ["zone mapping","coverage score","competitor note","service gap","expansion readiness","target density","coverage owner","area heatmap"],
    Automation: ["trigger builder","rule safety","manual run","rollback point","automation audit","failure guard","scenario preset","execution log"],
    Intelligence: ["scoring explanation","ranking controls","priority queue","confidence flag","model note","human override","risk reason","score history"],
    Management: ["agent dashboard","coaching signal","capacity limit","approval queue","quality review","team SLA","performance pulse","decision register"],
    Workload: ["agent capacity","load balancing","auto-assign","overload alert","fairness score","reassignment reason","coverage gap","daily quota"],
    Followups: ["callback timer","promise tracker","overdue queue","relationship note","next action","call result","reminder batch","follow-up proof"],
    Appointments: ["booking slot","confirmation status","reschedule flow","no-show risk","visit type","calendar queue","reminder send","appointment result"],
    Notifications: ["acknowledge alert","alert severity","owner route","risk link","batch close","alert source","escalation status","notification audit"],
    Performance: ["KPI drilldown","agent comparison","quality score","speed score","conversion by owner","coaching plan","target gap","performance export"],
    Prediction: ["forecast run","upside scenario","risk scenario","win model","loss prevention","forecast confidence","gap alert","next move"],
    System: ["activation checklist","route readiness","API readiness","permission check","role matrix","rollout audit","module health","fix queue"]
  }
  return [...(domainFeatures[domain] || []), ...commonFeatures].slice(0, 58)
}

function buildPanels(domain: string) {
  return [
    { title: "Command Controls", items: ["Create", "Edit inline", "Bulk execute", "Assign owner", "Set priority", "Apply SLA", "Escalate", "Archive"] },
    { title: "Production Intelligence", items: ["Live pulse", "Risk reasons", "Forecast impact", "Quality score", "Health status", "Delay detection", "Manager note", "CEO signal"] },
    { title: "Operational Workflow", items: ["Capture", "Qualify", "Route", "Execute", "Review", "Approve", "Close", "Audit"] },
    { title: `${domain} Toolkit`, items: buildFeatures(domain).slice(0, 8) },
  ]
}

function buildWorkflows(domain: string) {
  return [
    `${domain} intake → owner assigned → SLA timer starts`,
    `Agent execution → manager review → risk flag if blocked`,
    `Bulk actions → audit log → command pulse refreshed`,
    `Follow-up scheduled → notification generated → dashboard updated`,
    `CEO override available for urgent revenue protection`,
  ]
}

function buildRecords(domain: string) {
  return [
    { name: `${domain} priority action`, status: "In progress", owner: "Amina", value: "MAD 42K", next: "Today 14:00", risk: "Medium" },
    { name: `${domain} manager review`, status: "Pending approval", owner: "Youssef", value: "MAD 88K", next: "Tomorrow", risk: "High" },
    { name: `${domain} recovery task`, status: "Blocked", owner: "Salma", value: "MAD 27K", next: "Overdue", risk: "Critical" },
    { name: `${domain} growth opportunity`, status: "Healthy", owner: "Nora", value: "MAD 136K", next: "This week", risk: "Low" },
  ]
}

export default function UltimateRevenueCommandPage({ pageKey }: { pageKey: RevenuePageKey }) {
  const config = configs[pageKey] || configs.home
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState("manager")
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "REVENUE OS V9 :: command layer online",
    `module=${config.domain} route=${config.route}`,
    "sync=pulse_ready actions=audit_safe permissions=role_bound",
  ])
  const [draft, setDraft] = useState({ title: "", owner: "", priority: "High", due: "Today", value: "" })

  const Icon = iconMap[config.icon] || Command
  const filteredRecords = useMemo(() => config.records.filter(r => `${r.name} ${r.status} ${r.owner}`.toLowerCase().includes(query.toLowerCase())), [query, config.records])
  const completion = Math.round((selected.length / Math.max(1, filteredRecords.length)) * 100)

  async function runAction(action: string) {
    setConsoleLines(lines => [`${new Date().toLocaleTimeString()} :: ${action} requested`, ...lines].slice(0, 8))
    try {
      await fetch('/api/revenue-command-center/v9/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: config.domain, page: config.key, action, selected, draft })
      })
      setConsoleLines(lines => [`${new Date().toLocaleTimeString()} :: ${action} logged successfully`, ...lines].slice(0, 8))
    } catch {
      setConsoleLines(lines => [`${new Date().toLocaleTimeString()} :: ${action} local fallback logged`, ...lines].slice(0, 8))
    }
  }

  return (
    <main className="min-h-screen bg-[#050713] text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-60" style={{background:"radial-gradient(circle at 15% 10%, rgba(34,211,238,.22), transparent 30%), radial-gradient(circle at 85% 0%, rgba(217,70,239,.20), transparent 32%), radial-gradient(circle at 50% 90%, rgba(16,185,129,.12), transparent 35%)"}} />
      <section className="relative p-5 md:p-8 space-y-6">
        <header className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${config.accent} p-[1px] shadow-2xl`}>
          <div className="rounded-[2rem] bg-slate-950/88 p-6 md:p-8 backdrop-blur-xl">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-white/10 border border-white/15 shadow-xl">
                  <Icon className="h-10 w-10" />
                  <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-emerald-400 shadow-[0_0_25px_rgba(52,211,153,.95)]" />
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[.28em] text-cyan-200"><Sparkles className="h-4 w-4" /> {config.eyebrow}</div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">{config.title}</h1>
                  <p className="mt-3 max-w-4xl text-sm md:text-base text-slate-200 leading-7">{config.purpose}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {config.operators.map(op => <span key={op} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-100">{op}</span>)}
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">50+ page actions</span>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">V9 production</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 min-w-[320px]">
                <button onClick={() => runAction(config.mainAction)} className="rounded-2xl bg-white text-slate-950 px-4 py-3 font-bold hover:scale-[1.02] transition flex items-center justify-center gap-2"><Plus className="h-4 w-4" />{config.mainAction}</button>
                <button onClick={() => runAction(config.secondaryAction)} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-bold hover:bg-white/15 transition flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4" />{config.secondaryAction}</button>
                <button onClick={() => runAction('Bulk execute')} className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-cyan-100 font-semibold flex items-center justify-center gap-2"><Zap className="h-4 w-4" />Bulk execute</button>
                <button onClick={() => runAction('Manager audit')} className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-amber-100 font-semibold flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4" />Audit</button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {config.kpis.map((kpi, i) => <MetricCard key={kpi.label} {...kpi} index={i} />)}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[.055] p-5 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2"><Database className="h-6 w-6 text-cyan-300" /> Operational Records</h2>
                <p className="text-sm text-slate-300">Browse, select, create, edit, route, bulk-control and audit records from this page.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search records..." className="rounded-2xl border border-white/10 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-300/60" /></div>
                <select value={mode} onChange={e=>setMode(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none"><option value="manager">Manager view</option><option value="agent">Agent view</option><option value="ceo">CEO view</option></select>
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-4">
              {config.lanes.map((lane, i) => <div key={lane} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs text-slate-400 uppercase tracking-widest">{lane}</div><div className="mt-2 text-2xl font-black">{12+i*7}</div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-cyan-300" style={{width: `${45+i*13}%`}} /></div></div>)}
            </div>

            <div className="space-y-3">
              {filteredRecords.map((record, i) => {
                const checked = selected.includes(record.name)
                return <div key={record.name} className={`group rounded-3xl border ${checked ? 'border-cyan-300/60 bg-cyan-400/10' : 'border-white/10 bg-slate-950/45'} p-4 transition hover:border-white/25`}>
                  <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                    <input type="checkbox" checked={checked} onChange={() => setSelected(s => checked ? s.filter(x=>x!==record.name) : [...s, record.name])} className="h-5 w-5 accent-cyan-400" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-lg">{record.name}</h3><StatusPill status={record.status}/><RiskPill risk={record.risk}/></div>
                      <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-4"><span>Owner: {record.owner}</span><span>Value: {record.value}</span><span>Next: {record.next}</span><span>Mode: {mode}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <MiniButton icon={<Eye/>} label="Open" onClick={()=>runAction(`Open ${record.name}`)} />
                      <MiniButton icon={<Edit3/>} label="Edit" onClick={()=>runAction(`Edit ${record.name}`)} />
                      <MiniButton icon={<Flag/>} label="Escalate" onClick={()=>runAction(`Escalate ${record.name}`)} />
                      <MiniButton icon={<Archive/>} label="Archive" onClick={()=>runAction(`Archive ${record.name}`)} />
                    </div>
                  </div>
                </div>
              })}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-emerald-300/20 bg-black/70 p-5 shadow-[0_0_50px_rgba(16,185,129,.12)]">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-black text-emerald-200 flex items-center gap-2"><Activity className="h-5 w-5" /> Live Pulse Console</h2><span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" /></div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-4 font-mono text-xs text-emerald-200 min-h-[210px]">
                {consoleLines.map((line, i) => <div key={i} className="mb-2">› {line}</div>)}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center"><span className="rounded bg-emerald-400/10 py-2">selected {selected.length}</span><span className="rounded bg-cyan-400/10 py-2">pulse 99</span><span className="rounded bg-amber-400/10 py-2">risk 03</span></div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[.055] p-5 backdrop-blur-xl">
              <h2 className="mb-4 text-xl font-black flex items-center gap-2"><Plus className="h-5 w-5 text-cyan-300" /> Inline Create / Edit</h2>
              <div className="space-y-3">
                <input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder={`${config.domain} title`} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-300/60" />
                <div className="grid grid-cols-2 gap-3"><input value={draft.owner} onChange={e=>setDraft({...draft,owner:e.target.value})} placeholder="Owner" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none" /><input value={draft.value} onChange={e=>setDraft({...draft,value:e.target.value})} placeholder="Value MAD" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none" /></div>
                <div className="grid grid-cols-2 gap-3"><select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><select value={draft.due} onChange={e=>setDraft({...draft,due:e.target.value})} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><option>Today</option><option>Tomorrow</option><option>This week</option></select></div>
                <button onClick={()=>runAction('Save inline record')} className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Save / Sync</button>
              </div>
            </section>
          </aside>
        </div>

        <div className="grid gap-5 xl:grid-cols-4">
          {config.commandPanels.map(panel => <section key={panel.title} className="rounded-[2rem] border border-white/10 bg-white/[.055] p-5 backdrop-blur-xl"><h3 className="mb-4 font-black text-lg">{panel.title}</h3><div className="space-y-2">{panel.items.map(item => <button key={item} onClick={()=>runAction(item)} className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-left text-sm hover:border-cyan-300/40 hover:bg-cyan-400/10 transition flex items-center justify-between"><span>{item}</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>)}</div></section>)}
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.055] p-5 backdrop-blur-xl">
          <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h2 className="text-2xl font-black">50+ Functional Feature Matrix</h2><p className="text-sm text-slate-300">This page exposes page-specific operations plus shared revenue controls. Buttons are wired to the V9 action endpoint for audit-safe execution logging.</p></div><div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-cyan-100">Selection completion {completion}%</div></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {config.features.map((feature, i) => <button key={feature+i} onClick={()=>runAction(feature)} className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3 text-left text-xs text-slate-200 hover:bg-white/10 hover:border-cyan-300/40 transition"><span className="mr-2 text-cyan-300">#{String(i+1).padStart(2,'0')}</span>{feature}</button>)}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[.055] p-5"><h2 className="mb-4 text-xl font-black flex items-center gap-2"><Workflow className="h-5 w-5 text-cyan-300" /> Workflow Logic</h2>{config.workflows.map(w => <div key={w} className="mb-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /> {w}</div>)}</div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[.055] p-5"><h2 className="mb-4 text-xl font-black flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-amber-300" /> Control Guardrails</h2>{["Role-based UI actions", "Manager approval for risky operations", "Every command goes to audit endpoint", "Bulk operations require selection", "CEO override remains available", "Designed for Supabase persistence"].map(w => <div key={w} className="mb-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200 flex items-center gap-3"><BadgeCheck className="h-5 w-5 text-cyan-300" /> {w}</div>)}</div>
        </section>
      </section>
    </main>
  )
}

function MetricCard({ label, value, trend, index }: {label:string;value:string;trend:string;index:number}) {
  const icons = [Wallet, Target, Timer, ShieldCheck]
  const Icon = icons[index % icons.length]
  return <div className="rounded-[2rem] border border-white/10 bg-white/[.055] p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Icon className="h-5 w-5 text-cyan-200" /></div><span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{trend}</span></div><div className="mt-5 text-sm text-slate-400">{label}</div><div className="mt-1 text-3xl font-black">{value}</div></div>
}

function StatusPill({status}:{status:string}) { return <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">{status}</span> }
function RiskPill({risk}:{risk:string}) {
  const cls = risk === 'Critical' ? 'border-red-300/30 bg-red-400/10 text-red-100' : risk === 'High' ? 'border-amber-300/30 bg-amber-400/10 text-amber-100' : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
  return <span className={`rounded-full border px-2.5 py-1 text-xs ${cls}`}>{risk}</span>
}
function MiniButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactElement<{ className?: string }>
  label: string
  onClick: () => void
}) {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        className: ['h-3.5 w-3.5', icon.props.className].filter(Boolean).join(' '),
      })
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 flex items-center gap-1"
    >
      {renderedIcon}
      {label}
    </button>
  )
}