import { getSanilaPublicPage } from '../content'
import { ClosingStatement, EvidenceLedger, ProcessSequence, RoleAccessDoors, SectionHeading, SecurityArchitectureVisual } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function SecurityPage() {
  const page = getSanilaPublicPage('securite')!
  const principles = [['Identité','Savoir qui accède.'],['Rôle','Comprendre pourquoi.'],['Permission','Limiter ce qui est possible.'],['Contexte','Préserver les frontières institutionnelles.'],['Trace','Pouvoir relire ce qui s’est passé.']]
  return <>
    <section className={styles.securityHero}><div className={styles.securityHeroInner}><div className={styles.securityHeroCopy}><span>SÉCURITÉ / ARCHITECTURE DE CONFIANCE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div><SecurityArchitectureVisual /></div></section>
    <section className={styles.securityPrinciples}><SectionHeading index="01" eyebrow="CONSTITUTION D’ACCÈS" title="La sécurité commence par des frontières compréhensibles." body="Pas de badges inventés, pas de théâtre cyber : identités, rôles, permissions, contexte institutionnel et trace." /><div className={styles.securityPrinciplesGrid}>{principles.map(([a,b],i)=><div key={a}><span>0{i+1}</span><strong>{a}</strong><p>{b}</p></div>)}</div></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="02" eyebrow="PROCESSUS" title="Identifier, autoriser, isoler, opérer, tracer." /><ProcessSequence steps={page.workflow} variant="rail" /></section>
    <section className={styles.section}><SectionHeading index="03" eyebrow="ACCÈS RÉELS" title="Les rôles publics conduisent à de vrais espaces, jamais à l’Operator interne." /><RoleAccessDoors /></section>
    <section className={styles.section}><div className={styles.domainSplit}><div className={styles.domainManifesto}>La confiance vient plus de la clarté des frontières que de slogans de cybersécurité.</div><EvidenceLedger sources={page.evidenceSources}/></div></section>
    <ClosingStatement page={page} title="Examiner l’architecture d’accès de votre établissement." />
  </>
}
