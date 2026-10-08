import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, SectionHeading } from '../components/SanilaExperience'
import { CommunicationNetworkVisual, VisualPanel } from '../components/SanilaVisualSystems'
import styles from '../SanilaPublic.module.css'
export function CommunicationPage(){const page=getSanilaPublicPage('communication')!;return <>
  <section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>↔</div><div className={styles.domainEditorialCopy}><span>COMMUNICATION / RELATION</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
  <section className={`${styles.section} ${styles.sectionInk}`}><SectionHeading index="01" eyebrow="INFRASTRUCTURE DE RELATION" title="Un message utile relie un émetteur, une audience, un contexte et une conséquence." body="Les canaux externes restent conditionnels à leur configuration ; le schéma montre la responsabilité, pas une intégration inventée."/><div className={styles.homeSystemStage}><CommunicationNetworkVisual/></div></section>
  <section className={styles.section}><VisualPanel label="CHAÎNE DE COMMUNICATION" title="Le contexte doit survivre au canal."><div className={styles.pagePatternGridThree}>{[['Émetteur','Établissement'],['Audience','Famille / équipe'],['Message','Contexte structuré'],['Canal','Selon configuration'],['Conséquence','Information comprise'],['Trace','Historique relisible']].map(([a,b],i)=><div className={styles.pagePatternPanel} key={a}><span>0{i+1}</span><h3>{a}</h3><p>{b}</p></div>)}</div></VisualPanel></section>
  <section className={`${styles.section} ${styles.sectionSoft}`}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section><ClosingStatement page={page}/>
</>}
