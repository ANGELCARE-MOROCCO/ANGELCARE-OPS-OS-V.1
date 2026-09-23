import { getSanilaPublicPage } from '../content'
import { ClosingStatement, DomainNavigation, EditorialLead, FragmentationModel, InstitutionalMap, ProcessSequence, RoleAccessDoors, SectionHeading, SourceTruth } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function ProductPage() {
  const page = getSanilaPublicPage('produit')!
  return <>
    <EditorialLead page={page} index="01" label="ARCHITECTURE PRODUIT" align="split" />
    <section className={`${styles.section} ${styles.sectionInk}`}><SectionHeading index="02" eyebrow="MODÈLE INSTITUTIONNEL" title="Un système d’exploitation scolaire doit montrer comment l’institution tient ensemble." body="SANILA organise les responsabilités sans les confondre : le même établissement, plusieurs domaines, une continuité opérationnelle." /><div className={styles.homeSystemStage}><InstitutionalMap /></div></section>
    <section className={styles.section}><SectionHeading index="03" eyebrow="FRAGMENTATION → CONTINUITÉ" title="Ce que SANILA remplace n’est pas un logiciel unique. C’est la fragmentation." /><FragmentationModel /></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="04" eyebrow="WORKFLOW" title="L’architecture se prouve dans les transitions entre responsabilités." /><ProcessSequence steps={page.workflow} variant="journey" /></section>
    <section className={styles.section}><SectionHeading index="05" eyebrow="RÔLES" title="Une institution commune ne signifie pas une interface commune." /><RoleAccessDoors /></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><DomainNavigation /></section>
    <section className={styles.section}><SourceTruth page={page}/></section>
    <ClosingStatement page={page} title="Explorer SANILA comme système institutionnel, pas comme catalogue de modules." />
  </>
}
