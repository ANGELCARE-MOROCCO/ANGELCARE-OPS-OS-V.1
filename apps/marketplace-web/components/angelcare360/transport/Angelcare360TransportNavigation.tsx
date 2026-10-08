'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BusFront,
  CircleAlert,
  ClipboardCheck,
  History,
  MapPin,
  Route,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  Waypoints,
} from 'lucide-react'
import type { Angelcare360TransportNavigationItem } from '@/data/angelcare360/transport-navigation'
import styles from './sovereign/TransportSovereign.module.css'

const ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  overview: Activity,
  routes: Route,
  stops: MapPin,
  vehicles: BusFront,
  assignments: UsersRound,
  pickup: UserRoundCheck,
  dropoff: Waypoints,
  safety: ShieldCheck,
  incidents: CircleAlert,
  notifications: ClipboardCheck,
  audit: History,
}

export default function Angelcare360TransportNavigation({ items }: { items: Angelcare360TransportNavigationItem[] }) {
  const pathname = usePathname() || '/angelcare-360-command-center/transport'

  return (
    <nav className={styles.localNav} aria-label="Navigation Transport & Sécurité">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/angelcare-360-command-center/transport' && pathname.startsWith(`${item.href}/`))
        const Icon = ICONS[item.key] || Activity
        return (
          <Link
            key={item.key}
            href={item.href}
            className={styles.localNavItem}
            data-active={active ? 'true' : 'false'}
            aria-current={active ? 'page' : undefined}
            title={item.summary}
          >
            <span className={styles.localNavIcon}><Icon size={16} strokeWidth={1.9} /></span>
            <span className={styles.localNavText}><strong>{item.label}</strong><small>{item.summary}</small></span>
            {item.badge ? <span className={styles.localNavBadge}>{item.badge}</span> : null}
          </Link>
        )
      })}
    </nav>
  )
}
