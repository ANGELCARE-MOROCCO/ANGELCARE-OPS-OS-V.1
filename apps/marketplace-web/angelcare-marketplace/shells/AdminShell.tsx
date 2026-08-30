import Image from 'next/image'
import type { ReactNode } from 'react'
import { Globe2, ShieldCheck } from 'lucide-react'
import type { MarketplaceRequestContext } from '../domain/types'
import styles from '../design-system/marketplace.module.css'
import { AdminNavigation } from './AdminNavigation'
import { AdminLogoutButton } from '../auth/admin/AdminLogoutButton'
import { GlobalCommandPalette } from '../enterprise-command/components/GlobalCommandPalette'
import { GovernedActionProvider } from './GovernedActionProvider'
import { AdminWorkspaceContextNav } from './AdminWorkspaceContextNav'

export function AdminShell({ context, children }: { context: MarketplaceRequestContext; children: ReactNode }) {
  return (
    <div className={styles.workspaceFrame}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <Image src="/logo.png" alt="ANGELCARE" width={170} height={58} />
            <span>Marketplace · Master Backoffice</span>
          </div>
        </div>
        <AdminNavigation />
        <div className={styles.sidebarFooter}>
          <div className={styles.identityCard}>
            <div className={styles.identityName}>{context.actor.displayName}</div>
            <div className={styles.identityMeta}>
              {context.roleKeys.join(' · ')}<br />
              {context.actor.email || 'Identité interne'}
            </div>
            <AdminLogoutButton />
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
              {context.territoryId || 'Périmètre global'}
            </span>
            <span className={styles.scopeBadge}>
              <ShieldCheck size={13} />
              {context.permissions.length} permissions
            </span>
          </div>
        </header>
        <AdminWorkspaceContextNav />
        <main className={styles.content}><GovernedActionProvider>{children}</GovernedActionProvider></main>
      </section>
    </div>
  )
}
