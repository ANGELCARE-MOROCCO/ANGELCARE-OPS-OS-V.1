import type { MarketplaceAuditEvent } from '@/angelcare-marketplace/domain/types'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FoundationUnavailable } from '@/angelcare-marketplace/components/FoundationUnavailable'
import { AuditViewerClient } from '@/angelcare-marketplace/features/admin/AuditViewerClient'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'
import { Card, PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { PERMISSION_CATALOG } from '@/angelcare-marketplace/permissions/permission-catalog'
import { listMarketplaceAuditEvents } from '@/angelcare-marketplace/server/repository'

export const metadata = { title: 'Sécurité & audit' }

export default async function MarketplaceSecurityAuditPage() {
  const context = await requireMarketplacePageContext('marketplace.audit.view')
  let events: MarketplaceAuditEvent[] = []
  let available = true
  try { events = await listMarketplaceAuditEvents({ limit: 200 }) } catch { available = false }
  const securityPermissions = PERMISSION_CATALOG.filter((item) =>
    context.permissions.includes(item.key) && item.category === 'Sécurité',
  )
  return (
    <>
      <PageHeader
        eyebrow="Sécurité & preuve"
        title="Identité, permissions et audit"
        description="Les événements sensibles sont filtrables et exportables uniquement par les rôles autorisés. Les secrets, mots de passe et jetons ne sont jamais stockés dans la preuve d’audit."
      />
      <div className={styles.gridTwo} style={{ marginBottom: 16 }}>
        <Card title="Administrateur authentifié" subtitle="Contexte recalculé côté serveur">
          <div className={styles.detailMeta}>
            <div className={styles.metaItem}><span>Identité</span><strong>{context.actor.displayName}</strong></div>
            <div className={styles.metaItem}><span>Rôles</span><strong>{context.roleKeys.join(' · ')}</strong></div>
            <div className={styles.metaItem}><span>Périmètre</span><strong>{context.tenantId || context.territoryId || 'Global'}</strong></div>
          </div>
        </Card>
        <Card title="Permissions sécurité" subtitle={`${securityPermissions.length} contrôle(s) effectivement accordé(s)`}>
          <div className={styles.permissionGrid}>
            {securityPermissions.map((permission) => (
              <div key={permission.key} className={styles.permissionItem}>
                <strong>{permission.label}</strong>
                <code>{permission.key}</code>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {available
        ? <AuditViewerClient initialEvents={events} canExport={context.permissions.includes('marketplace.audit.export')} />
        : <FoundationUnavailable />}
    </>
  )
}
