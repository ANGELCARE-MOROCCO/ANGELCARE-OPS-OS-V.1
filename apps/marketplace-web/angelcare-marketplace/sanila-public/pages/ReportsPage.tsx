import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ReportingCanvasVisual, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'
export function ReportsPage(){const page=getSanilaPublicPage('rapports')!;return <>
<section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>R</div><div className={styles.domainEditorialCopy}><span>RAPPORTS / RESTITUTION</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
<section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="L’INSTITUTION SE RELIT" title="Un rapport ne vaut que par le contexte opérationnel dont il provient."/><div className={styles.pagePatternGrid}><ReportingCanvasVisual/><EvidenceLedger sources={page.evidenceSources}/></div></section>
<section className={styles.section}><CapabilityIndex page={page} columns={3}/></section><ClosingStatement page={page}/></>}
