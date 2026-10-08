import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading } from '../components/SanilaExperience'
import { LibraryCirculationVisual } from '../components/SanilaVisualSystems'
import styles from '../SanilaPublic.module.css'
export function LibraryPage(){const page=getSanilaPublicPage('bibliotheque')!;return <>
<section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>B</div><div className={styles.domainEditorialCopy}><span>BIBLIOTHÈQUE / CIRCULATION</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
<section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="RESSOURCE → DÉTENTEUR → RETOUR" title="La bibliothèque est un système de circulation et de responsabilité."/><LibraryCirculationVisual/></section>
<section className={styles.section}><SectionHeading index="02" eyebrow="WORKFLOW" title="Disponibilité, prêt, détenteur, retour et historique restent reliés."/><ProcessSequence steps={page.workflow} variant="journey"/></section>
<section className={`${styles.section} ${styles.sectionSoft}`}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section><ClosingStatement page={page}/></>}
