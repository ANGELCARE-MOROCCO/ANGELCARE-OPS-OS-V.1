import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'
export function InventoryPage(){const page=getSanilaPublicPage('inventaire')!;const objects=['Objet','Emplacement','Mouvement','Responsable','État','Historique'];return <>
<section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>□</div><div className={styles.domainEditorialCopy}><span>INVENTAIRE / ACTIFS PHYSIQUES</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
<section className={styles.pagePatternD}><SectionHeading index="01" eyebrow="CONTRÔLE PHYSIQUE" title="Savoir ce que l’établissement possède, où cela se trouve et ce qui lui est arrivé."/><div className={`${styles.pagePatternGrid} ${styles.pagePatternGridThree}`}>{objects.map((x,i)=><div className={styles.pagePatternPanel} key={x}><span>0{i+1}</span><h3>{x}</h3><p>Un objet institutionnel doit pouvoir conserver ce contexte sans dépendre de la mémoire d’une seule personne.</p></div>)}</div></section>
<section className={styles.section}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section><ClosingStatement page={page}/></>}
