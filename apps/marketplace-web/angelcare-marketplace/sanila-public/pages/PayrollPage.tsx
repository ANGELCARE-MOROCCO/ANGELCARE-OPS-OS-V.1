import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading } from '../components/SanilaExperience'
import { PayrollControlVisual } from '../components/SanilaVisualSystems'
import styles from '../SanilaPublic.module.css'
export function PayrollPage(){const page=getSanilaPublicPage('paie')!;return <>
  <section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>P</div><div className={styles.domainEditorialCopy}><span>PAIE / CONTRÔLE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
  <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="PÉRIODE → PAIEMENT" title="La paie est un processus gouverné, pas un montant final."/><div className={styles.homeSystemStage}><PayrollControlVisual/></div></section>
  <section className={styles.section}><SectionHeading index="02" eyebrow="SÉQUENCE DE CONTRÔLE" title="Chaque étape prépare la suivante et reste relisible."/><ProcessSequence steps={page.workflow} variant="ledger"/></section>
  <section className={`${styles.section} ${styles.sectionSoft}`}><div className={styles.domainSplitReverse}><EvidenceLedger sources={page.evidenceSources}/><CapabilityIndex page={page} columns={2}/></div></section><ClosingStatement page={page}/>
</>}
