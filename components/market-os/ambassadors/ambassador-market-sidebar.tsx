
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Map,
  TrendingUp,
  Activity,
  FileText,
  UserPlus,
  GraduationCap,
  Target,
  Gift,
  MapPinned,
  CalendarCheck,
  ClipboardList,
  Ticket,
  MessageSquare,
  Radar,
  Lightbulb,
  Folder,
  Settings,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const groups = [
  {
    label: "MAIN",
    items: [
      { label: "Overview", href: "/market-os/ambassadors", icon: LayoutDashboard },
      { label: "Ambassadors Directory", href: "/market-os/ambassadors/directory", icon: Users },
      { label: "Territories", href: "/market-os/ambassadors/territories", icon: Map },
      { label: "Performance", href: "/market-os/ambassadors/performance", icon: TrendingUp },
      { label: "Activities", href: "/market-os/ambassadors/activities", icon: Activity },
      { label: "Reports", href: "/market-os/ambassadors/reports", icon: FileText },
    ],
  },
  {
    label: "AMBASSADOR MANAGEMENT",
    items: [
      { label: "Recruitment", href: "/market-os/ambassadors/recruitment", icon: UserPlus },
      { label: "Onboarding", href: "/market-os/ambassadors/onboarding", icon: ClipboardList },
      { label: "Training & Certification", href: "/market-os/ambassadors/training-academy", icon: GraduationCap },
      { label: "Goals & KPIs", href: "/market-os/ambassadors/goals-kpis", icon: Target },
      { label: "Incentives", href: "/market-os/ambassadors/incentives", icon: Gift },
    ],
  },
  {
    label: "FIELD OPERATIONS",
    items: [
      { label: "Missions", href: "/market-os/ambassadors/missions", icon: MapPinned },
      { label: "Visits & Check-ins", href: "/market-os/ambassadors/visits-check-ins", icon: CalendarCheck },
      { label: "Task Management", href: "/market-os/ambassadors/tasks", icon: ClipboardList },
      { label: "Tickets & Requests", href: "/market-os/ambassadors/tickets", icon: Ticket },
    ],
  },
  {
    label: "MARKET INTELLIGENCE",
    items: [
      { label: "Surveys & Feedback", href: "/market-os/ambassadors/surveys-feedback", icon: MessageSquare },
      { label: "Competitor Tracking", href: "/market-os/ambassadors/competitor-tracking", icon: Radar },
      { label: "Market Insights", href: "/market-os/ambassadors/market-insights", icon: Lightbulb },
    ],
  },
  {
    label: "RESOURCES",
    items: [
      { label: "Documents", href: "/market-os/ambassadors/documents", icon: Folder },
      { label: "Communication Hub", href: "/market-os/ambassadors/communication-hub", icon: MessageSquare },
      { label: "Knowledge Base", href: "/market-os/ambassadors/knowledge-base", icon: Lightbulb },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Settings", href: "/market-os/ambassadors/settings", icon: Settings },
      { label: "Integrations", href: "/market-os/ambassadors/integrations", icon: Plug },
      { label: "Access & Permissions", href: "/market-os/ambassadors/access-permissions", icon: ShieldCheck },
    ],
  },
]

export default function AmbassadorMarketSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 h-screen w-[248px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-4 py-5">
      <div className="mb-6 px-2">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Market-OS</div>
        <div className="mt-1 text-xl font-black tracking-tight text-slate-950">Ambassador OS</div>
      </div>

      <nav className="space-y-6">
        {groups.map((group) => (
          <section key={group.label}>
            <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition",
                      active
                        ? "bg-violet-100 text-violet-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    ].join(" ")}
                  >
                    <Icon className={active ? "text-violet-700" : "text-slate-500"} size={16} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-black text-violet-700">Ask Angel AI</div>
            <div className="text-xs font-semibold text-slate-500">Your AI Assistant</div>
          </div>
          <Sparkles className="text-violet-500" size={20} />
        </div>
      </div>
    </aside>
  )
}
