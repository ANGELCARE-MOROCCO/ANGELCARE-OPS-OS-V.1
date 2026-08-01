import { CheckCircle2, KeyRound, UserRound } from 'lucide-react'
import type { MarketplaceRequestContext } from '../../domain/types'
import { PERMISSION_CATALOG } from '../../permissions/permission-catalog'
import styles from '../../design-system/marketplace.module.css'
import { Card, PageHeader, StatusChip } from '../../design-system/ui'

export function AccountAccess({ context }: { context: MarketplaceRequestContext }) {
  const visibleDefinitions = PERMISSION_CATALOG.filter((definition) =>
    context.permissions.includes(definition.key),
  )
  return (
    <>
      <PageHeader
        eyebrow="Identité & sécurité"
        title="Votre accès Marketplace"
        description="Cette vue explique l’identité, les rôles, le périmètre et les permissions effectivement résolus. Elle n’accorde aucun privilège supplémentaire."
      />
      <div className={styles.gridTwo}>
        <div className={styles.stack}>
          <Card title="Identité authentifiée" subtitle="Source : session interne ANGELCARE OPS">
            <div className={styles.detailMeta}>
              <div className={styles.metaItem}>
                <span>Utilisateur</span>
                <strong>{context.actor.displayName}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Rôle source</span>
                <strong>{context.actor.sourceRole || 'Non renseigné'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Locale</span>
                <strong>{context.locale.toUpperCase()}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Territoire</span>
                <strong>{context.territoryId || 'Global'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Tenant</span>
                <strong>{context.tenantId || 'Aucun tenant'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Session</span>
                <strong>{context.sessionReference ? 'Résolue' : 'Non exposée'}</strong>
              </div>
            </div>
          </Card>
          <Card title="Permissions effectives" subtitle={`${visibleDefinitions.length} permission(s) active(s)`}>
            <div className={styles.permissionGrid}>
              {visibleDefinitions.map((permission) => (
                <div key={permission.key} className={styles.permissionItem}>
                  <strong>{permission.label}</strong>
                  <code>{permission.key}</code>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className={styles.stack}>
          <Card title="Rôles Marketplace" subtitle="Résolution restrictive et compatible avec le rôle OPS">
            <div className={styles.list}>
              {context.roleKeys.map((roleKey) => (
                <div key={roleKey} className={styles.listItem}>
                  <span className={styles.listItemIcon}><UserRound size={16} /></span>
                  <div className={styles.listItemContent}>
                    <strong>{roleKey}</strong>
                    <p>Attribution de rôle utilisée par les contrôles serveur Marketplace.</p>
                  </div>
                  <StatusChip status="active" />
                </div>
              ))}
            </div>
          </Card>
          <div className={styles.noticeSuccess}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Accès explicable.</strong><br />
              Les décisions d’accès ne dépendent pas uniquement de la visibilité d’un bouton.
              Les APIs protégées recalculent l’identité et la permission côté serveur.
            </div>
          </div>
          <div className={styles.notice}>
            <KeyRound size={18} />
            <div>
              Une permission manquante doit être demandée à un administrateur autorisé. Aucun
              contournement par URL ou manipulation du navigateur n’est accepté.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
