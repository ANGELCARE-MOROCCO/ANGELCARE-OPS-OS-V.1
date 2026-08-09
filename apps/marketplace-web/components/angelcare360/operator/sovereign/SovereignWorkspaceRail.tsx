'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { resolveSovereignTower } from '@/data/angelcare360/operator-sovereign-navigation'
import styles from './SovereignExperience.module.css'

export default function SovereignWorkspaceRail() {
  const pathname = usePathname() || '/angelcare-360-operator'
  const searchParams = useSearchParams()
  const tower = resolveSovereignTower(pathname)

  return (
    <div className={styles.workspaceRailWrap} style={{ '--tower-accent': tower.accent, '--tower-deep': tower.accentDeep } as CSSProperties}>
      <div className={styles.workspaceRailIdentity}>
        <span>{tower.index}</span>
        <div><strong>{tower.shortLabel}</strong><small>{tower.signal}</small></div>
      </div>
      <nav className={styles.workspaceRail} aria-label={`Navigation ${tower.shortLabel}`}>
        {tower.navigation.map((item, index) => {
          const [itemPath, itemQuery = ''] = item.href.split('?')
          const itemParameters = new URLSearchParams(itemQuery)
          const itemView = itemParameters.get('view')
          const currentView = searchParams.get('view')
          const active = itemView
            ? pathname === itemPath && (currentView === itemView || (!currentView && index === 0))
            : ((pathname === itemPath && !currentView) || (itemPath !== tower.href && pathname.startsWith(`${itemPath}/`)))
          return <Link key={item.href} href={item.href} className={active ? styles.workspaceRailLinkActive : styles.workspaceRailLink}>{item.label}</Link>
        })}
      </nav>
    </div>
  )
}
