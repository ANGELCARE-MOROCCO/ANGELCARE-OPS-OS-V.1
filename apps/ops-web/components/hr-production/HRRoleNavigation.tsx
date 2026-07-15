import Link from 'next/link'
import { getHRNavigationForRole, type HRRole } from '@/lib/hr-production/permissions-navigation'

export default function HRRoleNavigation({ role = 'hr_admin' as HRRole }) {
  const items = getHRNavigationForRole(role)
  return <nav className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Role synced HR navigation</p><div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">{items.map(item => <Link key={item.href} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-100" href={item.href}>{item.label}<span className="mt-1 block text-[11px] uppercase tracking-wide text-slate-500">{item.area}</span></Link>)}</div></nav>
}
