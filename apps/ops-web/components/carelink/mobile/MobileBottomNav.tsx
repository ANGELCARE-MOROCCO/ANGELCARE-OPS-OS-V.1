'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CARELINK_MOBILE_NAV } from '@/lib/carelink/constants'

export function MobileBottomNav() {
  const pathname = usePathname()
  return <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur"><div className="grid grid-cols-5 gap-1">{CARELINK_MOBILE_NAV.map((item) => { const active = pathname === item.href || (item.href !== '/carelink' && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} className={`rounded-2xl px-2 py-2 text-center text-[11px] font-black ${active ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{item.label}</Link> })}</div></nav>
}
