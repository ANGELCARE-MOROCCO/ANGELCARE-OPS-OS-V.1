import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'
export function CommunicationPage(){const page=getSanilaPublicPage('communication')!;const lanes=[['Émetteur','Établissement'],['Audience','Famille / équipe'],['Message','Contexte structuré'],['Canal','Selon configuration'],['Conséquence','Information comprise']];return <>
  <section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>↔</div><div className={styles.domainEditorialCopy}><span>COMMUNICATION / RELATION</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
  <section className={`${styles.pagePatternC}`}><SectionHeading index="01" eyebrow="INFRASTRUCTURE DE RELATION" title="Un message n’est utile que s’il part de la bonne responsabilité vers la bonne audience."/><div className={`${styles.pagePatternGrid} ${styles.pagePatternGridThree}`}>{lanes.map(([a,b],i)=><div className={styles.pagePatternPanel} key={a}><span>0{i+1}</span><h3>{a}</h3><p>{b}</p></div>)}</div></section>
  <section className={styles.section}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section><ClosingStatement page={page}/>
</>}
