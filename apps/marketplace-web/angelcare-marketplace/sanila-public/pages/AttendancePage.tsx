import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function AttendancePage(){const page=getSanilaPublicPage('presences')!;const states=['Présent','Absent','Retard','Justifié'];return <>
  <section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>07:55</div><div className={styles.domainEditorialCopy}><span>PRÉSENCES / AUJOURD’HUI</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section>
  <OutcomeStrip page={page}/>
  <section className={`${styles.pagePatternB}`}><SectionHeading index="01" eyebrow="RHYTHME DU MATIN" title="La présence doit être plus rapide à exécuter qu’à expliquer."/><div className={`${styles.pagePatternGrid} ${styles.pagePatternGridThree}`}>{states.map((s,i)=><div className={styles.pagePatternPanel} key={s}><span>ÉTAT 0{i+1}</span><h3>{s}</h3><p>{i===0?'Rien à signaler.':i===1?'Une absence doit pouvoir porter son contexte.':i===2?'Un retard reste distinct d’une absence.':'Une justification conserve sa trace.'}</p></div>)}</div></section>
  <section className={styles.section}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section>
  <ClosingStatement page={page}/>
</>}
