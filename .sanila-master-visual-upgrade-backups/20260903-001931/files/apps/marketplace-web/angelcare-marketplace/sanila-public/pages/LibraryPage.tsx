import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'
export function LibraryPage(){const page=getSanilaPublicPage('bibliotheque')!;return <>
<section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>B</div><div className={styles.domainEditorialCopy}><span>BIBLIOTHÈQUE / CIRCULATION</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
<section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="RESSOURCE → DÉTENTEUR → RETOUR" title="La bibliothèque est un système de circulation et de responsabilité."/><ProcessSequence steps={page.workflow} variant="journey"/></section>
<section className={styles.section}><div className={styles.domainSplitReverse}><EvidenceLedger sources={page.evidenceSources}/><CapabilityIndex page={page} columns={2}/></div></section><ClosingStatement page={page}/></>}
