import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CirclePause,
  Globe2,
  Layers3,
  MapPinned,
  Radar,
  Rocket,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import type { Territory, TerritoryHealthEvent, TerritoryPortfolioSummary } from '../types'
import { formatDateTime } from '../format'
import styles from '../territory-os.module.css'
import { CommandPanel, TerritoryEmpty, TerritoryHealthPill, TerritoryStatusPill } from './TerritoryPrimitives'

export function TerritoryCommandCockpit({ territories, summary, recentEvents }: {
  territories: Territory[]
  summary: TerritoryPortfolioSummary
  recentEvents: TerritoryHealthEvent[]
}) {
  const decisions = [
    { label: 'Territoires en revue', detail: 'Décision de passage ou demande de correction', count: summary.review, icon: Rocket },
    { label: 'Territoires à risque', detail: 'Blocages, configuration ou preuve à résoudre', count: summary.unhealthy, icon: ShieldAlert },
    { label: 'Territoires suspendus', detail: 'Plan de reprise et validation avant réactivation', count: summary.paused, icon: CirclePause },
  ]
  return (
    <div className={styles.territoryCommand}>
      <section className={styles.commandHero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>Mega ZIP 02 · Expansion governed</span>
          <h1 className={styles.heroTitle}>Territory Command<br />Global Expansion OS</h1>
          <p className={styles.heroLead}>
            Créer, cloner, localiser, gouverner et lancer chaque territoire sans dupliquer le produit ni perdre les standards ANGELCARE. Chaque décision reste visible, assignée, bloquable et auditable.
          </p>
          <div className={styles.heroActions}>
            <Link href="/angelcare-marketplace/admin/territories/new" className={styles.heroPrimary}><Globe2 size={15} /> Créer un territoire</Link>
            <Link href="/angelcare-marketplace/admin/territories/clone" className={styles.heroSecondary}><Layers3 size={15} /> Cloner le Global Master</Link>
          </div>
        </div>
        <div className={styles.heroControl}>
          <div className={styles.heroControlHeader}><span>Portefeuille global</span><span className={styles.heroPulse} /></div>
          <div className={styles.heroControlValue}>{summary.averageReadiness}%</div>
          <div className={styles.heroControlLabel}>Niveau moyen de préparation calculé depuis les gates réelles de chaque territoire.</div>
          <div className={styles.heroControlDivider} />
          <div className={styles.heroControlRow}><span>Territoires actifs</span><strong>{summary.live}</strong></div>
          <div className={styles.heroControlRow}><span>Décisions critiques</span><strong>{summary.criticalBlockers}</strong></div>
          <div className={styles.heroControlRow}><span>Expansion en cours</span><strong>{summary.configuring + summary.review}</strong></div>
        </div>
      </section>

      <section className={styles.metricRail} aria-label="Indicateurs Territory OS">
        <Metric icon={<Globe2 size={13} />} label="Territoires" value={summary.total} hint="Registre gouverné" />
        <Metric icon={<Rocket size={13} />} label="En service" value={summary.live} hint="Lancement approuvé" />
        <Metric icon={<Sparkles size={13} />} label="Configuration" value={summary.configuring} hint="Travail en cours" />
        <Metric icon={<Radar size={13} />} label="En revue" value={summary.review} hint="Décision attendue" />
        <Metric icon={<ShieldAlert size={13} />} label="À risque" value={summary.unhealthy} hint="Action obligatoire" />
        <Metric icon={<AlertTriangle size={13} />} label="Blocages critiques" value={summary.criticalBlockers} hint="Événements ouverts" />
      </section>

      <section className={styles.commandGrid}>
        <CommandPanel
          title="Portefeuille d’expansion"
          subtitle="État exécutif des territoires les plus récemment modifiés."
          action={<Link href="/angelcare-marketplace/admin/territories/registry" className={styles.buttonSecondary}>Registre complet <ArrowRight size={13} /></Link>}
          flush
        >
          {territories.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Territoire</th><th>Statut</th><th>Santé</th><th>Langues</th><th>Préparation</th><th>Décision suivante</th></tr></thead>
                <tbody>
                  {territories.slice(0, 8).map((territory) => (
                    <tr key={territory.id}>
                      <td>
                        <Link href={`/angelcare-marketplace/admin/territories/${territory.territory_code}`} className={styles.territoryIdentity}>
                          <span className={styles.territoryMonogram}>{territory.country_code}</span>
                          <span className={styles.territoryName}><strong>{territory.name}</strong><span>{territory.territory_code} · {territory.timezone}</span></span>
                        </Link>
                      </td>
                      <td><TerritoryStatusPill status={territory.status} /></td>
                      <td><TerritoryHealthPill status={territory.health_status} /></td>
                      <td><span className={styles.localeSet}>{territory.active_locales.map((locale) => <span className={styles.localeTag} key={locale}>{locale}</span>)}</span></td>
                      <td><strong>{territory.readiness_score}%</strong></td>
                      <td><span className={styles.ownerBlock}><strong>{nextDecision(territory)}</strong><span>Dernière mise à jour {formatDateTime(territory.updated_at)}</span></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <TerritoryEmpty title="Aucun territoire enregistré" text="Créez Territory 1 comme monde opérationnel maître. Le système générera les paramètres, gates et responsabilités sans simuler un lancement." />}
        </CommandPanel>

        <div style={{ display: 'grid', gap: 18 }}>
          <CommandPanel title="File de décisions" subtitle="Ce qui nécessite une autorité humaine maintenant.">
            <div className={styles.decisionQueue}>
              {decisions.map(({ label, detail, count, icon: Icon }) => (
                <div className={styles.decisionItem} key={label}>
                  <span className={styles.decisionIcon}><Icon size={16} /></span>
                  <span className={styles.decisionContent}><strong>{label}</strong><p>{detail}</p></span>
                  <span className={styles.decisionCount}>{count}</span>
                </div>
              ))}
            </div>
          </CommandPanel>
          <CommandPanel title="Signal opérationnel" subtitle="Événements récents issus du journal de santé.">
            {recentEvents.length ? (
              <div className={styles.activityList}>
                {recentEvents.slice(0, 5).map((event) => (
                  <div className={styles.activityItem} key={event.id}>
                    <span className={styles.activityDot}>{event.severity === 'critical' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}</span>
                    <span className={styles.activityContent}><strong>{event.title}</strong><p>{event.description || 'Événement Territory OS.'}</p><span className={styles.activityMeta}>{formatDateTime(event.created_at)} · {event.status}</span></span>
                  </div>
                ))}
              </div>
            ) : <div className={styles.noticeInfo}><MapPinned size={16} /><span>Aucun événement critique enregistré. La santé reste déterminée par les gates et configurations réelles.</span></div>}
          </CommandPanel>
        </div>
      </section>
    </div>
  )
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: number; hint: string }) {
  return <article className={styles.metricCell}><span className={styles.metricLabel}>{icon}{label}</span><div className={styles.metricValue}>{value}</div><div className={styles.metricHint}>{hint}</div></article>
}

function nextDecision(territory: Territory): string {
  if (territory.status === 'draft') return 'Compléter l’identité'
  if (territory.status === 'configuring') return 'Résoudre les gates'
  if (territory.status === 'review') return 'Décision de lancement'
  if (territory.status === 'soft_launch') return 'Évaluer le passage live'
  if (territory.status === 'live') return 'Surveiller la santé'
  if (territory.status === 'paused') return 'Planifier la reprise'
  return 'Historique conservé'
}
