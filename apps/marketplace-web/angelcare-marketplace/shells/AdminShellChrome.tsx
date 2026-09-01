'use client'

import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { Globe2, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react'
import styles from '../design-system/marketplace.module.css'
import { AdminNavigation } from './AdminNavigation'
import { AdminLogoutButton } from '../auth/admin/AdminLogoutButton'
import { GlobalCommandPalette } from '../enterprise-command/components/GlobalCommandPalette'
import { GovernedActionProvider } from './GovernedActionProvider'
import { AdminWorkspaceContextNav } from './AdminWorkspaceContextNav'

const SIDEBAR_PREFERENCE_KEY = 'angelcare.marketplace.admin-sidebar.v1'

export function AdminShellChrome({
  actorDisplayName,
  actorEmail,
  roleKeys,
  territoryId,
  permissionCount,
  children,
}: {
  actorDisplayName: string
  actorEmail: string | null
  roleKeys: string[]
  territoryId: string | null
  permissionCount: number
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setCollapsed(window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === 'collapsed')
      } catch {
        setCollapsed(false)
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, next ? 'collapsed' : 'expanded')
      } catch {
        // The rail remains fully usable when a browser blocks preference storage.
      }
      return next
    })
  }

  return (
    <div className={styles.workspaceFrame} data-sidebar-collapsed={collapsed}>
      <aside className={styles.sidebar} aria-label="Navigation principale Marketplace Admin">
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <Image src="/logo.png" alt="ANGELCARE" width={170} height={58} />
            <span>Marketplace · Master Backoffice</span>
          </div>
          <button
            type="button"
            className={styles.sidebarCollapseButton}
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Déployer la navigation Marketplace' : 'Réduire la navigation Marketplace'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déployer la navigation' : 'Réduire la navigation'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <AdminNavigation collapsed={collapsed} />
        <div className={styles.sidebarFooter}>
          <div className={styles.identityCard} title={collapsed ? `${actorDisplayName} · ${roleKeys.join(' · ') || 'Opérateur Marketplace'}` : undefined}>
            <div className={styles.identityAvatar} aria-hidden="true">{actorDisplayName.trim().charAt(0).toUpperCase() || 'A'}</div>
            <div className={styles.identityCopy}>
              <div className={styles.identityName}>{actorDisplayName}</div>
              <div className={styles.identityMeta}>
                {roleKeys.join(' · ')}<br />
                {actorEmail || 'Identité interne'}
              </div>
            </div>
            <AdminLogoutButton compact={collapsed} />
          </div>
        </div>
      </aside>
      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>ANGELCARE BUILD 360 · Commandement global</span>
          <div className={styles.topbarMeta}>
            <GlobalCommandPalette />
            <span className={styles.scopeBadge}>
              <Globe2 size={13} />
              {territoryId || 'Périmètre global'}
            </span>
            <span className={styles.scopeBadge}>
              <ShieldCheck size={13} />
              {permissionCount} permissions
            </span>
          </div>
        </header>
        <AdminWorkspaceContextNav />
        <main className={`${styles.content} ${styles.adminContent}`}><GovernedActionProvider>{children}</GovernedActionProvider></main>
      </section>
    </div>
  )
}
