import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, SectionHeading } from '../components/SanilaExperience'
import { InventoryMatrixVisual } from '../components/SanilaVisualSystems'
import styles from '../SanilaPublic.module.css'
export function InventoryPage(){const page=getSanilaPublicPage('inventaire')!;return <>
<section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>I</div><div className={styles.domainEditorialCopy}><span>INVENTAIRE / CONTRÔLE PHYSIQUE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
<section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="OBJET → LIEU → RESPONSABILITÉ" title="Un inventaire devient utile quand l’objet reste relié à sa localisation, son état et son responsable."/><div className={styles.homeSystemStage}><InventoryMatrixVisual/></div></section>
<section className={styles.section}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section><ClosingStatement page={page}/></>}
