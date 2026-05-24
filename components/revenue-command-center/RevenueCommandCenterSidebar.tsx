"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, CalendarDays, CheckCircle2, Handshake, Mail, Map, MessageCircle, ShieldCheck, Target, UsersRound } from "lucide-react"

const navItems = [
  { label: "Command Center", href: "/revenue-command-center", icon: Target },
  { label: "Prospects Directory", href: "/revenue-command-center/prospects/directory", icon: UsersRound },
  { label: "Partner Program", href: "/revenue-command-center/partnerships", icon: Handshake },
  { label: "Tasks & Actions", href: "/revenue-command-center/daily-tasks", icon: CheckCircle2 },
  { label: "Calendar", href: "/revenue-command-center/appointments", icon: CalendarDays },
  { label: "Email Campaigns", href: "/revenue-command-center/email-campaigns", icon: Mail },
  { label: "WhatsApp Center", href: "/revenue-command-center/whatsapp-center", icon: MessageCircle },
  { label: "Market Map", href: "/revenue-command-center/market-map", icon: Map },
  { label: "Analytics & Reports", href: "/revenue-command-center/analytics", icon: BarChart3 },
  { label: "Market Insights", href: "/revenue-command-center/market-insights", icon: ShieldCheck },
]

export function RevenueCommandCenterSidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 z-[999] flex h-screen w-[260px] flex-col border-r border-white/10 bg-[#050b18] text-white shadow-2xl">
      <div className="flex h-28 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-2xl font-black text-white">✦</div>
        <div><div className="text-xl font-black tracking-[0.34em] text-white">ANGELCARE</div><div className="text-[10px] font-black uppercase tracking-[0.28em] text-white">Prospect Center</div></div>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/revenue-command-center" && pathname?.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white ${active ? "bg-gradient-to-r from-violet-600 to-blue-600" : "bg-white/[0.07] hover:bg-white/[0.12]"}`}>
              <Icon className="h-5 w-5 text-white" /><span className="text-white">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="m-4 rounded-3xl border border-emerald-400/40 bg-emerald-900/40 p-4 text-white">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-white">Live Sync</div>
        <div className="mt-2 text-xs font-bold leading-5 text-white">Prospects • Tasks • Calendar • Partnerships</div>
      </div>
    </aside>
  )
}
