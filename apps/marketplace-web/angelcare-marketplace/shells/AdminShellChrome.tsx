'use client'

import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import styles from '../design-system/marketplace.module.css'
import type { AdminShellSnapshot, AdminShellWorkspace } from '../admin-shell/types'
import { AdminShellCommandSurface } from '../admin-shell/AdminShellCommandSurface'
import { AdminNavigation } from './AdminNavigation'
import { AdminLogoutButton } from '../auth/admin/AdminLogoutButton'
import { GovernedActionProvider } from './GovernedActionProvider'
import { AdminWorkspaceContextNav } from './AdminWorkspaceContextNav'

const SIDEBAR_PREFERENCE_KEY = 'angelcare.marketplace.admin-sidebar.v1'

export function AdminShellChrome({
  actorDisplayName,
  actorEmail,
  roleKeys,
  territoryId,
  permissionCount,
  canHotline,
  canDce,
  canSeo,
  canSupplierCommand,
  snapshot,
  workspaces,
  children,
}: {
  actorDisplayName: string
  actorEmail: string | null
  roleKeys: string[]
  territoryId: string | null
  permissionCount: number
  canHotline?: boolean
  canDce?: boolean
  canSeo?: boolean
  canSupplierCommand?: boolean
  snapshot: AdminShellSnapshot
  workspaces: AdminShellWorkspace[]
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname() || ''
  const dce = pathname === '/angelcare-marketplace/admin/digital-customer-experience' || pathname.startsWith('/angelcare-marketplace/admin/digital-customer-experience/')
  const [dceExpanded, setDceExpanded] = useState(false)
  const railCollapsed = dce ? !dceExpanded : collapsed
  useEffect(() => { if (!dce) setDceExpanded(false) }, [dce])

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
    if (dce) { setDceExpanded(current => !current); return }
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
    <div className={styles.workspaceFrame} data-sidebar-collapsed={railCollapsed} data-digital-experience={dce}>
      <aside className={styles.sidebar} aria-label="Navigation principale Marketplace Admin">
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <Image src="/brand/angelcare-pearl-rim-colour-r1.png" alt="ANGELCARE" width={170} height={58} priority />
            <span>Marketplace · Master Backoffice</span>
          </div>
          <button
            type="button"
            className={styles.sidebarCollapseButton}
            onClick={toggleSidebar}
            aria-label={railCollapsed ? 'Déployer la navigation Marketplace' : 'Réduire la navigation Marketplace'}
            aria-expanded={!railCollapsed}
            title={railCollapsed ? 'Déployer la navigation' : 'Réduire la navigation'}
          >
            {railCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <AdminNavigation collapsed={railCollapsed} canHotline={canHotline} canDce={canDce} canSeo={canSeo} canSupplierCommand={canSupplierCommand} />
        <div className={styles.sidebarFooter}>
          <div className={styles.identityCard} title={railCollapsed ? `${actorDisplayName} · ${roleKeys.join(' · ') || 'Opérateur Marketplace'}` : undefined}>
            <div className={styles.identityAvatar} aria-hidden="true">{actorDisplayName.trim().charAt(0).toUpperCase() || 'A'}</div>
            <div className={styles.identityCopy}>
              <div className={styles.identityName}>{actorDisplayName}</div>
              <div className={styles.identityMeta}>
                {roleKeys.join(' · ') || 'Opérateur Marketplace'}<br />
                {actorEmail || 'Identité interne'}
              </div>
            </div>
            <AdminLogoutButton compact={railCollapsed} />
          </div>
        </div>
      </aside>
      <section className={styles.workspace}>
        <AdminShellCommandSurface
          snapshot={snapshot}
          workspaces={workspaces}
          territoryId={territoryId}
          permissionCount={permissionCount}
        />
        <AdminWorkspaceContextNav />
        <main className={`${styles.content} ${styles.adminContent}`} style={dce ? {padding: 0} : undefined}><GovernedActionProvider>{children}</GovernedActionProvider></main>
      </section>
    </div>
  )
}
