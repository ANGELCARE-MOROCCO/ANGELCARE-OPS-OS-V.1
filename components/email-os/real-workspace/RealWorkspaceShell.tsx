"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
  Folder,
  Inbox,
  Mail,
  Menu,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Zap
} from "lucide-react"

const nav = [
  { href: "/email-os", label: "Inbox", icon: Inbox },
  { href: "/email-os/mailboxes", label: "Mailboxes", icon: Folder },
  { href: "/email-os/configuration", label: "Configuration", icon: Settings },
  { href: "/email-os/templates", label: "Templates", icon: FileText },
  { href: "/email-os/automation", label: "Automation", icon: Zap },
  { href: "/email-os/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/email-os/outbox", label: "Outbox", icon: Send },
  { href: "/email-os/audit", label: "Audit", icon: CheckCircle2 },
  { href: "/email-os/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/email-os/runtime", label: "Runtime", icon: Activity }
]

export default function RealWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
      <aside className="hidden w-[280px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">AngelCare Email-OS</div>
            <div className="text-xs text-slate-500">Live workspace</div>
          </div>
        </div>

        <div className="p-4">
          <Link
            href="/email-os/compose"
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
          >
            <Send className="h-4 w-4" />
            Compose
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== "/email-os" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              placeholder="Search live Email-OS records, mailboxes, templates, audit..."
            />
          </div>

          <Link href="/email-os/runtime" className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50">
            <RefreshCw className="h-5 w-5 text-slate-600" />
          </Link>
          <Link href="/email-os/audit" className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50">
            <Bell className="h-5 w-5 text-slate-600" />
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
