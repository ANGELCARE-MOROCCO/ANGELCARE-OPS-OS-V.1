"use client"

import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  DatabaseZap,
  FileText,
  Globe2,
  LayoutDashboard,
  Mail,
  MapPinned,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react"

type CanonicalWorkspaceProps = {
  workspace?: string
  recordId?: string
  mode?: string
  pageKey?: string
  title?: string
  subtitle?: string
}

const workspaceLabels: Record<string, { title: string; subtitle: string; icon: React.ReactNode; href: string }> = {
  campaigns: { title: "Campaign Command", subtitle: "Canonical campaign workspace routed through the production shell.", icon: <Mail />, href: "/revenue-command-center/campaigns" },
  campaignBoard: { title: "Campaign Board", subtitle: "Campaign execution board and pipeline controls.", icon: <LayoutDashboard />, href: "/revenue-command-center/campaigns/board" },
  campaignNew: { title: "New Campaign", subtitle: "Create campaign context and route execution through the action engine.", icon: <Zap />, href: "/revenue-command-center/campaigns/new" },
  campaignDetail: { title: "Campaign Detail", subtitle: "Campaign record detail workspace.", icon: <FileText />, href: "/revenue-command-center/campaigns" },
  campaignAssets: { title: "Campaign Assets", subtitle: "Assets, documents and media control layer.", icon: <FileText />, href: "/revenue-command-center/campaigns" },
  campaignExecution: { title: "Campaign Execution", subtitle: "Execution checklist and live action layer.", icon: <CheckCircle2 />, href: "/revenue-command-center/campaigns" },
  campaignPerformance: { title: "Campaign Performance", subtitle: "Performance KPIs and post-action analysis.", icon: <BarChart3 />, href: "/revenue-command-center/campaigns" },
  automation: { title: "Automation Center", subtitle: "Canonical automation command center.", icon: <Zap />, href: "/revenue-command-center/automation" },
  businessDevelopment: { title: "Business Development", subtitle: "BD execution workspace connected to the revenue operating system.", icon: <BriefcaseBusiness />, href: "/revenue-command-center/business-development" },
  growth: { title: "Growth Command", subtitle: "Growth signals, market expansion and revenue acceleration.", icon: <Target />, href: "/revenue-command-center/growth" },
  management: { title: "Revenue Management", subtitle: "Team controls, ownership, workload and operating discipline.", icon: <Users />, href: "/revenue-command-center/management" },
  myWork: { title: "My Work", subtitle: "Assigned work, open tasks and personal execution queue.", icon: <CheckCircle2 />, href: "/revenue-command-center/my-work" },
  notifications: { title: "Notifications", subtitle: "Alerts, escalations and command-center updates.", icon: <Bell />, href: "/revenue-command-center/notifications" },
  b2c: { title: "B2C Workflow", subtitle: "Canonical B2C workflow shell until the B2C module receives its own source-of-truth pass.", icon: <Users />, href: "/revenue-command-center/b2c-workflow" },
  predictive: { title: "Predictive Revenue", subtitle: "AI scoring, readiness and predictive controls.", icon: <Radar />, href: "/revenue-command-center/predictive" },
  executive: { title: "Executive Briefing", subtitle: "Executive control tower and strategic briefing layer.", icon: <ShieldCheck />, href: "/revenue-command-center/executive-briefing" },
  sdr: { title: "SDR Execution", subtitle: "Follow-up discipline, callbacks and recovery motions.", icon: <MessageCircle />, href: "/revenue-command-center/sdr-execution" },
  prospects: { title: "Prospect Control", subtitle: "Canonical prospect workspace. Use Directory/Profile for full production controls.", icon: <MapPinned />, href: "/revenue-command-center/prospects/directory" },
}

function getWorkspaceMeta(workspace?: string, mode?: string, title?: string, subtitle?: string) {
  const key = workspace || mode || "command"
  const meta = workspaceLabels[key] || {
    title: title || key.split(/[-_]/).filter(Boolean).map((x) => x[0]?.toUpperCase() + x.slice(1)).join(" ") || "Revenue Workspace",
    subtitle: subtitle || "Canonical Revenue Command Center workspace.",
    icon: <DatabaseZap />,
    href: "/revenue-command-center",
  }
  return { ...meta, title: title || meta.title, subtitle: subtitle || meta.subtitle, key }
}

export default function CanonicalRevenueWorkspace({ workspace, recordId, mode, title, subtitle }: CanonicalWorkspaceProps) {
  const meta = getWorkspaceMeta(workspace, mode, title, subtitle)

  const quickLinks = [
    { href: "/revenue-command-center/prospects/directory", label: "Prospects Directory", icon: <MapPinned /> },
    { href: "/revenue-command-center/prospects", label: "Prospects HQ", icon: <Radar /> },
    { href: "/revenue-command-center/daily-tasks", label: "Daily Tasks", icon: <CheckCircle2 /> },
    { href: "/revenue-command-center/appointments", label: "Appointments", icon: <CalendarDays /> },
    { href: "/revenue-command-center/revenue-analytics", label: "Analytics", icon: <BarChart3 /> },
    { href: "/production-persistence-center", label: "Persistence", icon: <DatabaseZap /> },
  ]

  return (
    <main className="rcc-shell-main w-full max-w-none min-w-0 flex-1 min-h-screen bg-[#050b16] p-4 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(59,130,246,.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,.16),transparent_28%),linear-gradient(180deg,#07111f_0%,#030814_72%,#020611_100%)]" />
      <section className="relative w-full max-w-none min-w-0 ">
        <header className="mb-4 rounded-[32px] border border-[#244365] bg-[#07111f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,.32)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-600 text-slate-950 shadow-lg shadow-yellow-500/20 [&_svg]:h-8 [&_svg]:w-8">
                <Sparkles />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">AngelCare Revenue Command Center</div>
                <h1 className="mt-1 text-3xl font-black text-white">{meta.title}</h1>
                <p className="mt-1 max-w-3xl text-sm font-semibold text-[#cbd5e1]">{meta.subtitle}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-black text-emerald-200">
              CANONICAL ROUTE · BUILD RESTORED
            </div>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatusCard label="Workspace" value={meta.key} detail="legacy route compatibility" icon={meta.icon} />
          <StatusCard label="Record ID" value={recordId || "module"} detail="dynamic routing preserved" icon={<FileText />} />
          <StatusCard label="Source" value="Canonical" detail="old generation removed" icon={<DatabaseZap />} />
          <StatusCard label="Next Pass" value="Source of Truth" detail="module-specific Supabase wiring" icon={<ShieldCheck />} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
          <div className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-6 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            <h2 className="text-xl font-black text-white">Canonical Transition Workspace</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#cbd5e1]">
              This route is no longer connected to archived legacy UI generations. It is now safely routed through the canonical command shell so the build can pass while the module receives a dedicated production source-of-truth pass.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ActionLink href="/revenue-command-center/prospects/directory" label="Open Production Prospects Directory" detail="Most advanced production-backed area" icon={<MapPinned />} />
              <ActionLink href="/revenue-command-center/prospects" label="Open Prospects Command Center" detail="Prospect metrics and market map" icon={<Radar />} />
              <ActionLink href="/revenue-command-center/daily-tasks" label="Open Tasks Module" detail="Next stabilization target" icon={<CheckCircle2 />} />
              <ActionLink href="/revenue-command-center/appointments" label="Open Appointments Module" detail="Next source-of-truth target" icon={<CalendarDays />} />
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-semibold text-amber-100">
              This is intentional: it prevents broken imports from old files while keeping every URL alive. The next phase will replace each shell with its own real production module.
            </div>
          </div>

          <aside className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-6 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            <h2 className="text-lg font-black text-white">Route Control</h2>
            <div className="mt-4 space-y-3">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-[#244365] bg-[#10223a] p-4 text-sm font-black text-white transition hover:border-cyan-300/50 hover:bg-[#172942]">
                  <span className="text-cyan-300 [&_svg]:h-5 [&_svg]:w-5">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-[#94a3b8]" />
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  )
}

function StatusCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#07111f]/90 p-5">
      <div className="mb-3 text-cyan-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div>
      <div className="mt-1 truncate text-lg font-black text-white">{value}</div>
      <div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div>
    </div>
  )
}

function ActionLink({ href, label, detail, icon }: { href: string; label: string; detail: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group rounded-2xl border border-[#244365] bg-[#10223a] p-5 transition hover:border-blue-400/50 hover:bg-[#172942]">
      <div className="mb-4 text-blue-300 transition group-hover:text-blue-200 [&_svg]:h-7 [&_svg]:w-7">{icon}</div>
      <div className="font-black text-white">{label}</div>
      <div className="mt-1 text-xs font-semibold text-[#cbd5e1]">{detail}</div>
    </Link>
  )
}
