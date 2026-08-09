import {
  Activity,
  Boxes,
  ClipboardCheck,
  FileClock,
  Flag,
  ShieldCheck,
} from 'lucide-react'
import type {
  MarketplaceAuditEvent,
  MarketplaceModule,
  MarketplaceReadinessCheck,
} from '../../domain/types'
import styles from '../../design-system/marketplace.module.css'
import {
  ButtonLink,
  Card,
  MetricCard,
  PageHeader,
  StatusChip,
} from '../../design-system/ui'

interface Health {
  status: 'healthy' | 'degraded'
  database: 'connected' | 'migration_required'
  audit: 'ready' | 'unavailable'
  moduleRegistry: 'ready' | 'unavailable'
  readiness: 'ready' | 'unavailable'
  checkedAt: string
}

export function FoundationCockpit({
  modules,
  readiness,
  auditEvents,
  health,
}: {
  modules: MarketplaceModule[]
  readiness: MarketplaceReadinessCheck[]
  auditEvents: MarketplaceAuditEvent[]
  health: Health
}) {
  const active = modules.filter((module) => module.enabled).length
  const blocked = modules.filter((module) => ['blocked', 'degraded'].includes(module.status)).length
  const ready = readiness.filter((check) => check.status === 'ready').length
  const requiredPending = readiness.filter((check) => check.required_for_release && check.status !== 'ready').length
  return (
    <>
      <PageHeader
        eyebrow="Master Backoffice"
        title="Cockpit de fondation"
        description="Une vue de commandement basée sur le registre réel, les contrôles de préparation et les preuves d’audit. Aucun chiffre commercial fictif n’est injecté dans ce socle."
        actions={
          <>
            <ButtonLink href="/angelcare-marketplace/admin/readiness">Contrôles de préparation</ButtonLink>
            <ButtonLink href="/angelcare-marketplace/admin/security-audit" variant="secondary">Preuves d’audit</ButtonLink>
          </>
        }
      />
      {health.status === 'degraded' ? (
        <div className={styles.noticeWarning}>
          <Activity size={18} />
          <div>
            <strong>Fondation dégradée.</strong><br />
            La migration ou une dépendance de données n’est pas active. Le système affiche ce blocage au lieu de simuler un état sain.
          </div>
        </div>
      ) : (
        <div className={styles.noticeSuccess}>
          <ShieldCheck size={18} />
          <div><strong>Fondation connectée.</strong> Registre, audit et préparation répondent dans cet environnement.</div>
        </div>
      )}
      <div className={styles.metricGrid} style={{ marginTop: 16 }}>
        <MetricCard label="Modules enregistrés" value={modules.length} hint={`${active} actif(s) · ${blocked} bloqué(s) ou dégradé(s)`} icon={<Boxes size={17} />} />
        <MetricCard label="Feature foundation" value={active} hint="Modules réellement actifs, pas routes décoratives." icon={<Flag size={17} />} />
        <MetricCard label="Contrôles prêts" value={`${ready}/${readiness.length}`} hint={`${requiredPending} obligatoire(s) restant(s)`} icon={<ClipboardCheck size={17} />} />
        <MetricCard label="Preuves récentes" value={auditEvents.length} hint="Événements chargés dans la vue de contrôle." icon={<FileClock size={17} />} />
      </div>
      <div className={styles.gridTwo}>
        <Card
          title="État du registre"
          subtitle="Les Mega ZIPs futurs restent non installés jusqu’à leur exécution contractuelle."
          action={<ButtonLink href="/angelcare-marketplace/admin/modules" variant="quiet">Ouvrir le registre</ButtonLink>}
        >
          <div className={styles.list}>
            {modules.slice(0, 7).map((module) => (
              <div key={module.id} className={styles.listItem}>
                <span className={styles.listItemIcon}><Boxes size={16} /></span>
                <div className={styles.listItemContent}>
                  <strong>{module.name}</strong>
                  <p>ZIP {String(module.introduced_by_mega_zip).padStart(2, '0')} · {module.route_prefix}</p>
                </div>
                <StatusChip status={module.status} />
              </div>
            ))}
          </div>
        </Card>
        <div className={styles.stack}>
          <Card title="Santé technique" subtitle={`Dernier contrôle : ${new Date(health.checkedAt).toLocaleString('fr-FR')}`}>
            <div className={styles.list}>
              {[
                ['Base', health.database],
                ['Registre', health.moduleRegistry],
                ['Audit', health.audit],
                ['Préparation', health.readiness],
              ].map(([label, status]) => (
                <div key={label} className={styles.listItem}>
                  <span className={styles.listItemIcon}><Activity size={16} /></span>
                  <div className={styles.listItemContent}><strong>{label}</strong><p>Contrôle de disponibilité non sensible.</p></div>
                  <StatusChip status={status} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Prochain devoir contractuel" subtitle="Le cockpit ne signe pas à la place des responsables.">
            {requiredPending ? (
              <div className={styles.noticeWarning}>
                <ClipboardCheck size={18} />
                <div>{requiredPending} contrôle(s) obligatoire(s) doivent encore recevoir une preuve et un propriétaire.</div>
              </div>
            ) : (
              <div className={styles.noticeSuccess}>
                <ShieldCheck size={18} />
                <div>Les contrôles obligatoires sont prêts pour la revue et le sign-off autorisé.</div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
