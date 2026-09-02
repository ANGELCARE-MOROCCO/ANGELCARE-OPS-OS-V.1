import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading, StructureTreeVisual } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function AdministrationPage(){const page=getSanilaPublicPage('administration')!;return <>
  <section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>01</div><div className={styles.domainEditorialCopy}><span>ADMINISTRATION / STRUCTURE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section>
  <OutcomeStrip page={page}/>
  <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="CARTOGRAPHIE DE L’ÉTABLISSEMENT" title="La qualité des opérations dépend d’abord d’une structure institutionnelle propre."/><div className={styles.pagePatternGrid}><StructureTreeVisual/><EvidenceLedger sources={page.evidenceSources}/></div></section>
  <section className={styles.section}><SectionHeading index="02" eyebrow="DE LA STRUCTURE À L’USAGE" title="Organiser avant d’exécuter."/><ProcessSequence steps={page.workflow} variant="vertical"/></section>
  <section className={`${styles.section} ${styles.sectionCompact}`}><CapabilityIndex page={page} columns={4}/></section>
  <ClosingStatement page={page}/>
</>}
