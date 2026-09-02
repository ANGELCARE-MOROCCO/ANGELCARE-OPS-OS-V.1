import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'
export function PayrollPage(){const page=getSanilaPublicPage('paie')!;return <>
  <section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>P</div><div className={styles.domainEditorialCopy}><span>PAIE / CONTRÔLE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
  <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="PÉRIODE → PAIEMENT" title="La paie est un processus gouverné, pas un montant final."/><ProcessSequence steps={page.workflow} variant="ledger"/></section>
  <section className={styles.section}><div className={styles.domainSplitReverse}><EvidenceLedger sources={page.evidenceSources}/><CapabilityIndex page={page} columns={2}/></div></section><ClosingStatement page={page}/>
</>}
