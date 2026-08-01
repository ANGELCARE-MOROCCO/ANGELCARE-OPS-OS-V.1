import {
  ArrowRight,
  Boxes,
  CircleUserRound,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import type {
  MarketplaceModule,
  MarketplaceRequestContext,
} from '../../domain/types'
import styles from '../../design-system/marketplace.module.css'
import {
  ButtonLink,
  Card,
  MetricCard,
  PageHeader,
  StatePanel,
  StatusChip,
} from '../../design-system/ui'

export function WorkspaceHome({
  context,
  modules,
  dataAvailable,
}: {
  context: MarketplaceRequestContext
  modules: MarketplaceModule[]
  dataAvailable: boolean
}) {
  const available = modules.filter((module) => module.enabled)
  return (
    <>
      <PageHeader
        eyebrow="Espace sécurisé"
        title={`Bienvenue, ${context.actor.displayName}`}
        description="Votre espace applique les rôles, permissions et périmètres résolus par la fondation ANGELCARE Marketplace. Les domaines futurs apparaissent uniquement lorsqu’ils sont réellement installés et autorisés."
        actions={
          context.permissions.includes('marketplace.admin.access') ? (
            <ButtonLink href="/angelcare-marketplace/admin">
              Master Backoffice <ArrowRight size={15} />
            </ButtonLink>
          ) : (
            <ButtonLink href="/angelcare-marketplace/account">Voir mon accès</ButtonLink>
          )
        }
      />

      <div className={styles.metricGrid}>
        <MetricCard
          label="Rôles actifs"
          value={context.roleKeys.length}
          hint={context.roleKeys.join(' · ')}
          icon={<CircleUserRound size={17} />}
        />
        <MetricCard
          label="Permissions résolues"
          value={context.permissions.length}
          hint="Contrôlées côté serveur pour chaque action protégée."
          icon={<LockKeyhole size={17} />}
        />
        <MetricCard
          label="Modules disponibles"
          value={available.length}
          hint="Seulement les modules réellement activés."
          icon={<Boxes size={17} />}
        />
        <MetricCard
          label="Périmètre"
          value={context.tenantId ? 'Tenant' : context.territoryId ? 'Territoire' : 'Global'}
          hint={context.tenantId || context.territoryId || 'Socle ANGELCARE'}
          icon={<ShieldCheck size={17} />}
        />
      </div>

      {!dataAvailable ? (
        <Card body={false}>
          <StatePanel
            type="blocked"
            title="Migration de fondation requise"
            text="L’interface est prête, mais la base additive Mega ZIP 01 n’est pas active dans cet environnement. Aucune liste fictive ne remplace les modules persistants."
            actions={
              context.permissions.includes('marketplace.readiness.view') ? (
                <ButtonLink href="/angelcare-marketplace/admin/readiness">Voir le contrôle de préparation</ButtonLink>
              ) : (
                <ButtonLink href="/angelcare-marketplace/account">Vérifier mon accès</ButtonLink>
              )
            }
          />
        </Card>
      ) : available.length ? (
        <Card
          title="Modules autorisés"
          subtitle="Registre réel filtré par activation. Les permissions spécifiques seront appliquées par chaque domaine."
        >
          <div className={styles.list}>
            {available.map((module) => (
              <div key={module.id} className={styles.listItem}>
                <span className={styles.listItemIcon}><Boxes size={16} /></span>
                <div className={styles.listItemContent}>
                  <strong>{module.name}</strong>
                  <p>{module.description || 'Module ANGELCARE Marketplace gouverné.'}</p>
                </div>
                <StatusChip status={module.status} />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card body={false}>
          <StatePanel
            type="empty"
            title="Aucun module activé pour votre rôle"
            text="Le socle est disponible, mais aucun domaine opérationnel supplémentaire n’est encore activé pour ce périmètre. Cette absence est explicite et ne masque pas de faux contenu."
            actions={<ButtonLink href="/angelcare-marketplace/account">Comprendre mon accès</ButtonLink>}
          />
        </Card>
      )}
    </>
  )
}
