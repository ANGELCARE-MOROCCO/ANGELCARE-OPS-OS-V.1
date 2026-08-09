import Link from 'next/link'
import { ArrowLeft, Boxes, CheckCircle2, Network, ShieldCheck } from 'lucide-react'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { getMarketplaceModule } from '@/angelcare-marketplace/server/repository'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'
import { ButtonLink, Card, PageHeader, StatusChip } from '@/angelcare-marketplace/design-system/ui'

export const metadata = { title: 'Détail module' }

export default async function MarketplaceModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleKey: string }>
}) {
  await requireMarketplacePageContext('marketplace.modules.view')
  const { moduleKey } = await params
  const module = await getMarketplaceModule(moduleKey)
  return (
    <>
      <PageHeader
        eyebrow={`Mega ZIP ${String(module.introduced_by_mega_zip).padStart(2, '0')}`}
        title={module.name}
        description={module.description || 'Module enregistré dans la constitution ANGELCARE Marketplace.'}
        breadcrumbs={<><Link href="/angelcare-marketplace/admin/modules">Modules</Link><span>/</span><span>{module.module_key}</span></>}
        actions={<ButtonLink href="/angelcare-marketplace/admin/modules" variant="secondary"><ArrowLeft size={14} /> Retour</ButtonLink>}
      />
      <section className={styles.detailHero}>
        <div>
          <StatusChip status={module.status} />
          <h2>{module.module_key}</h2>
          <p>
            Cette vue expose le cycle de vie, les dépendances, les périmètres et les permissions du module.
            L’activation reste contrôlée depuis le registre et ne remplace pas la livraison de son Mega ZIP.
          </p>
          <div className={styles.detailMeta}>
            <div className={styles.metaItem}><span>Route</span><strong>{module.route_prefix}</strong></div>
            <div className={styles.metaItem}><span>Santé</span><strong>{module.health_status}</strong></div>
            <div className={styles.metaItem}><span>Version</span><strong>v{module.version}</strong></div>
            <div className={styles.metaItem}><span>Propriétaire</span><strong>{module.owner_role || 'À assigner'}</strong></div>
            <div className={styles.metaItem}><span>Navigation</span><strong>{module.navigation_group || 'Non publiée'} · {module.navigation_order}</strong></div>
            <div className={styles.metaItem}><span>Feature flag</span><strong>{module.feature_flag_key || 'Non requis'}</strong></div>
          </div>
        </div>
        <span className={styles.stateIcon}><Boxes size={26} /></span>
      </section>
      <div className={styles.gridTwo} style={{ marginTop: 16 }}>
        <Card title="Périmètres et audiences">
          <div className={styles.list}>
            <div className={styles.listItem}>
              <span className={styles.listItemIcon}><Network size={16} /></span>
              <div className={styles.listItemContent}><strong>Audiences</strong><p>{module.audience.join(' · ') || 'Aucune audience publiée'}</p></div>
            </div>
            <div className={styles.listItem}>
              <span className={styles.listItemIcon}><ShieldCheck size={16} /></span>
              <div className={styles.listItemContent}><strong>Scoping</strong><p>Territoire : {module.territory_aware ? 'oui' : 'non'} · Tenant : {module.tenant_aware ? 'oui' : 'non'} · Locale : {module.locale_aware ? 'oui' : 'non'}</p></div>
            </div>
          </div>
        </Card>
        <Card title="Dépendances et permissions">
          <div className={styles.list}>
            <div className={styles.listItem}>
              <span className={styles.listItemIcon}><Network size={16} /></span>
              <div className={styles.listItemContent}><strong>Dépendances</strong><p>{module.required_dependencies.join(' · ') || 'Aucune dépendance déclarée'}</p></div>
            </div>
            <div className={styles.listItem}>
              <span className={styles.listItemIcon}><CheckCircle2 size={16} /></span>
              <div className={styles.listItemContent}><strong>Permissions</strong><p>{module.required_permissions.join(' · ') || 'Permission de fondation uniquement'}</p></div>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
