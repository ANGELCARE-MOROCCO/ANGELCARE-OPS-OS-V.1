import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading, TransportTopologyVisual } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function TransportPage() {
  const page = getSanilaPublicPage('transport')!
  return <>
    <section className={styles.transportHero}><div className={styles.transportHeroInner}><div className={styles.transportHeroCopy}><span>TRANSPORT / ESPACE / RESPONSABILITÉ</span><h1>{page.title}</h1><p>{page.subtitle}</p></div><TransportTopologyVisual /></div></section>
    <OutcomeStrip page={page} />
    <section className={styles.transportOperations}><SectionHeading index="01" eyebrow="OPÉRATION TERRAIN" title="Un circuit est une structure opérationnelle, pas un simple nom de trajet." /><div className={styles.transportOperationsGrid}><div><h3>Relier circuit, arrêt, véhicule et affectation.</h3><p>La qualité de l’opération dépend de la clarté des responsabilités et de la capacité à relire ce qui était prévu. SANILA ne prétend pas fournir un GPS si l’infrastructure n’existe pas ; il organise ce qui relève réellement de l’établissement.</p><CapabilityIndex page={page} columns={2}/></div><EvidenceLedger sources={page.evidenceSources}/></div></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="02" eyebrow="DU CIRCUIT À L’INCIDENT" title="Structurer l’enchaînement terrain." /><ProcessSequence steps={page.workflow} variant="vertical" /></section>
    <ClosingStatement page={page} title="Voir comment SANILA structure le transport sans inventer de capacités externes." />
  </>
}
