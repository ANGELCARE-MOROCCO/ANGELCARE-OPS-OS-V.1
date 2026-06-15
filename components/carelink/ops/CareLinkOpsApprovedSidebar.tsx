'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Overview', href: '/carelink-ops' },
  { label: 'Dispatch', href: '/carelink-ops/dispatch' },
  { label: 'Missions', href: '/carelink-ops/missions' },
  { label: 'Agents', href: '/carelink-ops/agents' },
  { label: 'Schedule', href: '/carelink-ops/schedule' },
  { label: 'Calendar', href: '/carelink-ops/calendar' },
  { label: 'Incidents', href: '/carelink-ops/incidents' },
  { label: 'Reports', href: '/carelink-ops/reports' },
  { label: 'Compliance', href: '/carelink-ops/compliance' },
  { label: 'Quality', href: '/carelink-ops/quality' },
  { label: 'Workforce', href: '/carelink-ops/workforce' },
  { label: 'Payments', href: '/carelink-ops/payments' },
  { label: 'Notifications', href: '/carelink-ops/notifications' },
  { label: 'Messages', href: '/carelink-ops/messages' },
  { label: 'Audit', href: '/carelink-ops/audit' },
  { label: 'Service Config', href: '/carelink-ops/service-config' },
  { label: 'Readiness', href: '/carelink-ops/readiness' },
  { label: 'Replacements', href: '/carelink-ops/replacements' },
  { label: 'Performance', href: '/carelink-ops/performance' },
  { label: 'Settings', href: '/carelink-ops/settings' },
]

export function CareLinkOpsApprovedSidebar() {
  const pathname = usePathname()

  return (
    <aside data-carelink-global-sidebar className="fixed inset-y-0 left-0 z-[999] w-[220px] overflow-y-auto border-r border-slate-200 bg-white p-3">
      <Link href="/carelink-ops" className="mb-5 block rounded-[1.5rem] bg-blue-600 p-5 text-white shadow-xl shadow-blue-100">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-100">AngelCare</p>
        <h1 className="mt-2 text-2xl font-black leading-tight">CareLink Ops</h1>
        <p className="mt-2 text-xs font-semibold text-blue-100">Enterprise operations backbone</p>
      </Link>

      <nav className="space-y-1 pb-6">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/carelink-ops' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-black transition ${
                active ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-950 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">Live Sync</p>
        <p className="mt-2 text-xs font-black text-slate-700">Synchronisation active</p>
        <p className="mt-1 text-[11px] font-semibold text-slate-400">CareLink Ops API ready</p>
      </div>
    </aside>
  )
}
