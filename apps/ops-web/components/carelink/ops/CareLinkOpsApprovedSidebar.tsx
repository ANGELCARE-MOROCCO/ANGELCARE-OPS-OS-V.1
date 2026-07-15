'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const CARELINK_OPS_MENU = [
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

function isActive(pathname: string, href: string) {
  if (href === '/carelink-ops') return pathname === '/carelink-ops'
  if (href === '/caregivers') return pathname.startsWith('/caregivers')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function CareLinkOpsApprovedSidebar() {
  const pathname = usePathname() || ''

  return (
    <aside
      data-carelink-global-sidebar
      className="fixed inset-y-0 left-0 z-[999] w-[220px] overflow-y-auto border-r border-slate-200 bg-white px-0 py-4 shadow-[12px_0_30px_rgba(15,23,42,0.03)]"
    >
      <div className="px-0">
        <div className="mx-0 rounded-[28px] bg-blue-600 px-6 py-6 text-slate-950 shadow-[0_18px_45px_rgba(37,99,235,0.24)]">
          <div className="text-[10px] font-black uppercase tracking-[0.45em] text-slate-900/55">
            AngelCare
          </div>
          <div className="mt-2 text-[26px] font-black leading-[0.98] tracking-[-0.04em] text-black">
            CareLink
            <br />
            Ops
          </div>
          <div className="mt-5 text-[12px] font-bold leading-5 text-slate-900/55">
            Enterprise operations
            <br />
            backbone
          </div>
        </div>
      </div>

      <nav className="mt-8 space-y-2 px-0">
        {CARELINK_OPS_MENU.map((item) => {
          const active = isActive(pathname, item.href)

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={[
                'block w-full px-5 py-3 text-[15px] font-black tracking-[-0.02em] transition',
                active
                  ? 'rounded-r-[22px] border border-blue-100 bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-950 hover:rounded-r-[22px] hover:bg-slate-50 hover:text-blue-700',
              ].join(' ')}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mx-0 mb-5 mt-10 rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
        <div className="text-[10px] font-black uppercase tracking-[0.38em] text-slate-500">
          Live Sync
        </div>
        <div className="mt-4 text-sm font-black text-slate-600">
          Synchronisation active
        </div>
        <div className="mt-2 text-xs font-black text-slate-500">
          CareLink Ops API ready
        </div>
      </div>
    </aside>
  )
}

export default CareLinkOpsApprovedSidebar
