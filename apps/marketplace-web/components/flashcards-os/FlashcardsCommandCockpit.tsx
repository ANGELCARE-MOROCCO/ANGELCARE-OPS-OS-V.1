import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Database,
  FileCheck2,
  Layers3,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { FlashcardsDashboardData } from '@/lib/flashcards-os/types'
import styles from './flashcards-os.module.css'

function formatDh(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)
}

export default function FlashcardsCommandCockpit({ data }: { data: FlashcardsDashboardData }) {
  const lifecycleOrder = [
    ['legacy_intake', 'Legacy intake'],
    ['structuring', 'Structuration'],
    ['content_draft', 'Content draft'],
    ['review', 'Review'],
    ['approved', 'Approved'],
    ['published', 'Published'],
  ] as const

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Command · Direction produit & doctrine</p>
          <h1 className={styles.pageTitle}>Product Command Theatre</h1>
          <p className={styles.pageLead}>
            Un centre de décision exécutif pour transformer le catalogue historique en portefeuille structuré,
            traçable, extensible et prêt pour les prochains moteurs Intelligence, Solutions, Revenue et Delivery.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sourceBanner}>
            <Database size={13} /> Source active&nbsp;: <strong>{data.sourceMode === 'database' ? 'flashcards_os live' : 'catalogue seed contrôlé'}</strong>
          </span>
          <Link className={styles.secondaryButton} href="/flashcards-os/governance/import-control">
            <AlertTriangle size={14} /> Arbitrer {data.openIssues} anomalies
          </Link>
          <Link className={styles.actionButton} href="/flashcards-os/product">
            Ouvrir Product <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className={styles.commandStage}>
        <div className={styles.commandMain}>
          <article className={styles.executiveHorizon}>
            <div className={styles.horizonTop}>
              <div>
                <p className={styles.eyebrow}>Portfolio operating horizon · Ultra Mega ZIP 1</p>
                <h2 className={styles.horizonTitle}>{data.portfolioName}</h2>
                <p className={styles.horizonCopy}>
                  Le portefeuille dispose maintenant d’une identité canonique, d’une taxonomie gouvernée, d’un registre
                  de collections, d’une trajectoire de versions et d’une file de décisions qui refuse toute correction
                  silencieuse du catalogue source.
                </p>
              </div>
              <div className={styles.horizonSeal}><Layers3 size={35} /></div>
            </div>
            <div className={styles.horizonMetrics}>
              <div className={styles.horizonMetric}>
                <div className={styles.metricValue}>{data.collections}</div>
                <div className={styles.metricLabel}>Collections contrôlées</div>
                <div className={styles.metricDetail}>Inventaire importé depuis les pages 3 à 7 du catalogue.</div>
              </div>
              <div className={styles.horizonMetric}>
                <div className={styles.metricValue}>{data.expectedCards.toLocaleString('fr-FR')}</div>
                <div className={styles.metricLabel}>Cartes attendues documentées</div>
                <div className={styles.metricDetail}>Hors produits dont la quantité historique est indiquée N/A.</div>
              </div>
              <div className={styles.horizonMetric}>
                <div className={styles.metricValue}>{data.categories}</div>
                <div className={styles.metricLabel}>Nœuds taxonomiques</div>
                <div className={styles.metricDetail}>10 domaines maîtres et 12 sous-domaines opérationnels.</div>
              </div>
              <div className={styles.horizonMetric}>
                <div className={styles.metricValue}>{formatDh(data.historicalPortfolioValueDh)}</div>
                <div className={styles.metricLabel}>Dh · valeur catalogue</div>
                <div className={styles.metricDetail}>Somme indicative des prix unitaires historiques, non révisée.</div>
              </div>
            </div>
          </article>

          <div className={styles.pressureMap}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Portfolio pressure map</h3>
                  <p className={styles.panelSubtitle}>Concentration des collections, volume attendu et dette de structuration par domaine actif.</p>
                </div>
                <Radar size={18} color="#3150b5" />
              </div>
              <div className={styles.panelBody}>
                <div className={styles.domainRows}>
                  {data.topDomains.map((domain) => {
                    const width = Math.max(12, Math.round(domain.collections / Math.max(...data.topDomains.map((item) => item.collections)) * 100))
                    return (
                      <div className={styles.domainRow} key={domain.id}>
                        <div className={styles.domainName}>
                          {domain.name}
                          <span className={styles.domainMeta}>{domain.collections} collections · {domain.issues} alertes</span>
                        </div>
                        <div className={styles.progressTrack} aria-label={`${domain.collections} collections`}>
                          <div className={styles.progressFill} style={{ width: `${width}%` }} />
                        </div>
                        <div className={styles.progressValue}>{domain.expectedCards} cartes</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Lifecycle runway</h3>
                  <p className={styles.panelSubtitle}>État réel du portefeuille, sans présentation artificielle de maturité.</p>
                </div>
                <FileCheck2 size={18} color="#3150b5" />
              </div>
              <div className={styles.panelBody}>
                <div className={styles.lifecycleRail}>
                  {lifecycleOrder.map(([key, label]) => (
                    <div className={styles.lifecycleItem} key={key}>
                      <div className={styles.lifecycleLabel}>{label}</div>
                      <div className={styles.lifecycleCount}>{data.lifecycle[key] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>

        <aside className={styles.decisionColumn}>
          <section className={styles.decisionPanel}>
            <div className={styles.decisionHeader}>
              <h3 className={styles.decisionTitle}>Executive decision queue</h3>
              <p className={styles.decisionSubtitle}>Les anomalies importées restent ouvertes jusqu’à arbitrage produit documenté.</p>
            </div>
            <div className={styles.decisionList}>
              {data.decisionQueue.map((issue) => (
                <Link className={styles.decisionItem} href={`/flashcards-os/product/collections/${issue.collectionCode.toLowerCase()}`} key={issue.id}>
                  <div className={styles.decisionTop}>
                    <span className={styles.decisionCode}>{issue.collectionCode} · P.{issue.sourcePage}</span>
                    <span className={styles.decisionSeverity}>{issue.severity}</span>
                  </div>
                  <div className={styles.decisionName}>{issue.collectionName}</div>
                  <div className={styles.decisionReason}>{issue.explanation}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.dataIntegrity}>
            <div className={styles.integrityTop}>
              <span className={styles.integrityIcon}><ShieldCheck size={19} /></span>
              <div>
                <div className={styles.integrityTitle}>Doctrine d’intégrité active</div>
                <div className={styles.insightLabel}>No silent correction</div>
              </div>
            </div>
            <p className={styles.integrityCopy}>
              Les titres dupliqués, quantités N/A, numéros historiques répétés et classifications discutables sont
              conservés comme faits source. Leur résolution doit produire une décision, une justification et un événement d’audit.
            </p>
          </section>

          <section className={styles.registryInsight}>
            <div className={styles.insightLabel}>Portfolio readiness</div>
            <div className={styles.insightValue}>{data.averageReadiness}%</div>
            <p className={styles.insightCopy}>Le score reflète l’état de structuration initial, pas une maturité commerciale artificielle.</p>
            <div style={{ marginTop: 14 }} className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${data.averageReadiness}%` }} />
            </div>
          </section>

          <section className={styles.registryInsight}>
            <div className={styles.integrityTop}>
              <span className={styles.integrityIcon}><Sparkles size={18} /></span>
              <div>
                <div className={styles.integrityTitle}>Backbone prepared</div>
                <div className={styles.insightLabel}>6 univers · 1 product truth</div>
              </div>
            </div>
            <p className={styles.insightCopy}>Les frontières des prochains univers sont déjà contractées sans simuler leurs moteurs avant leurs livraisons signées.</p>
          </section>
        </aside>
      </section>
    </>
  )
}
