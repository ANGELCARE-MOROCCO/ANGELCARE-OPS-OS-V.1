import Link from 'next/link'
import { ArrowRight, Boxes, CircleGauge, Database, Layers3, ShieldAlert } from 'lucide-react'
import type { FlashcardsDashboardData } from '@/lib/flashcards-os/types'
import styles from './flashcards-os.module.css'

export default function PortfolioLandscape({ data }: { data: FlashcardsDashboardData }) {
  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Product · Portfolio engineering</p>
          <h1 className={styles.pageTitle}>Portfolio Landscape</h1>
          <p className={styles.pageLead}>
            La vue structurelle du portefeuille : domaines maîtres, sous-domaines, collections, volumes attendus,
            dette de contenu et points de décision issus du catalogue historique.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sourceBanner}><Database size={13} /> {data.sourceMode === 'database' ? 'Live schema' : 'Seed evidence mode'}</span>
          <Link className={styles.secondaryButton} href="/flashcards-os/product/taxonomy">Taxonomy Atlas</Link>
          <Link className={styles.actionButton} href="/flashcards-os/product/collections">Collection Registry <ArrowRight size={15} /></Link>
        </div>
      </header>

      <section className={styles.portfolioGrid}>
        <article className={styles.portfolioHero}>
          <p className={styles.eyebrow} style={{ color: '#aebffc' }}>Canonical product hierarchy</p>
          <h2 className={styles.portfolioHeroTitle}>Un portefeuille n’est ni un PDF, ni un dossier Windows, ni une simple liste de prix.</h2>
          <p className={styles.portfolioHeroCopy}>
            Flashcards OS gouverne désormais la chaîne Portfolio → Famille → Catégorie → Collection → Version → Édition → Format → Variante → Release. Cette séparation permet de réutiliser une même vérité pédagogique dans plusieurs offres sans dupliquer le cœur produit.
          </p>
          <div className={styles.portfolioArchitecture}>
            <div className={styles.archNode}><div className={styles.archNodeValue}>1</div><div className={styles.archNodeLabel}>Portfolio</div></div>
            <div className={styles.archNode}><div className={styles.archNodeValue}>1</div><div className={styles.archNodeLabel}>Product family</div></div>
            <div className={styles.archNode}><div className={styles.archNodeValue}>{data.categories}</div><div className={styles.archNodeLabel}>Taxonomy nodes</div></div>
            <div className={styles.archNode}><div className={styles.archNodeValue}>{data.collections}</div><div className={styles.archNodeLabel}>Collections</div></div>
          </div>
        </article>

        <aside className={styles.portfolioControl}>
          <div className={styles.domainCardTop}>
            <div>
              <div className={styles.insightLabel}>Structural readiness</div>
              <h3 className={styles.panelTitle} style={{ marginTop: 5 }}>Portefeuille sous contrôle</h3>
            </div>
            <CircleGauge size={20} color="#403db8" />
          </div>
          <div className={styles.controlScore}>
            <div className={styles.scoreRing}><div className={styles.scoreInner}>{data.averageReadiness}%</div></div>
            <div className={styles.scoreNotes}>
              <div className={styles.scoreNote}><span>Identités & codes</span><strong>Actifs</strong></div>
              <div className={styles.scoreNote}><span>Card-level content</span><strong>{data.structuredCards}/{data.expectedCards}</strong></div>
              <div className={styles.scoreNote}><span>Anomalies ouvertes</span><strong>{data.openIssues}</strong></div>
              <div className={styles.scoreNote}><span>Commercial readiness</span><strong>Legacy only</strong></div>
            </div>
          </div>
          <p className={styles.insightCopy} style={{ marginTop: 17 }}>
            Le score est volontairement conservateur. Aucune collection n’est présentée comme finalisée tant que son registre de cartes, sa doctrine, ses versions et ses approbations ne sont pas réellement constitués.
          </p>
        </aside>

        {data.topDomains.map((domain, index) => (
          <article className={styles.domainCard} key={domain.id}>
            <div className={styles.domainCardTop}>
              <span className={styles.domainCardIcon}>{index % 2 ? <Layers3 size={18} /> : <Boxes size={18} />}</span>
              <span className={styles.domainCardCount}>{domain.issues ? `${domain.issues} decision flags` : 'no imported flag'}</span>
            </div>
            <h3 className={styles.domainCardTitle}>{domain.name}</h3>
            <p className={styles.domainCardCopy}>
              Domaine actif issu de la nomenclature 2022, désormais rattaché à une architecture extensible et à des sous-domaines opérationnels.
            </p>
            <div className={styles.domainCardStats}>
              <div className={styles.domainCardStat}><strong>{domain.collections}</strong><span>Collections</span></div>
              <div className={styles.domainCardStat}><strong>{domain.expectedCards}</strong><span>Cartes attendues</span></div>
              <div className={styles.domainCardStat}><strong>{domain.readiness}%</strong><span>Readiness</span></div>
            </div>
          </article>
        ))}

        <article className={styles.domainCard}>
          <div className={styles.domainCardTop}>
            <span className={styles.domainCardIcon}><ShieldAlert size={18} /></span>
            <span className={styles.domainCardCount}>Governance control</span>
          </div>
          <h3 className={styles.domainCardTitle}>Legacy intake decisions</h3>
          <p className={styles.domainCardCopy}>Les doublons, numéros incohérents et quantités manquantes restent dans une file d’arbitrage séparée du contenu canonique.</p>
          <div style={{ marginTop: 20 }}>
            <Link className={styles.rowLink} href="/flashcards-os/governance/import-control">Ouvrir le control plane →</Link>
          </div>
        </article>
      </section>
    </>
  )
}
