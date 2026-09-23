import { getSanilaPublicPage } from '../content'
import { ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'
export function ClaimsPage(){const page=getSanilaPublicPage('reclamations')!;return <>
<section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>!</div><div className={styles.domainEditorialCopy}><span>RÉCLAMATIONS / RÉCUPÉRATION DE CONFIANCE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section><OutcomeStrip page={page}/>
<section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="BOUCLE DE RÉSOLUTION" title="Un signalement devient utile quand il acquiert un responsable, une action et une trace."/><ProcessSequence steps={page.workflow} variant="vertical"/></section>
<section className={styles.section}><div className={styles.domainSplit}><div className={styles.domainManifesto}>La qualité de la relation famille se mesure aussi à la façon dont l’établissement traite ce qui ne s’est pas bien passé.</div><EvidenceLedger sources={page.evidenceSources}/></div></section><ClosingStatement page={page}/></>}
