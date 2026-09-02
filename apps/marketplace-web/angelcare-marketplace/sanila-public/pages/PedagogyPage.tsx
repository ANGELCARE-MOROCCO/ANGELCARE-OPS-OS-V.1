import { getSanilaPublicPage } from '../content'
import { AcademicGridVisual, CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, ProcessSequence, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function PedagogyPage() {
  const page = getSanilaPublicPage('pedagogie')!
  return <>
    <section className={styles.pedagogyHero}><div className={styles.pedagogyHeroInner}><div className={styles.pedagogyHeroCopy}><span>PÉDAGOGIE / CONTINUITÉ ACADÉMIQUE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div><AcademicGridVisual /></div></section>
    <OutcomeStrip page={page} />
    <section className={styles.pedagogyEditorial}><SectionHeading index="01" eyebrow="MONDE ACADÉMIQUE" title="La pédagogie mérite son propre rythme visuel et opérationnel." /><div className={styles.pedagogyEditorialGrid}><div className={styles.pedagogyEditorialQuote}>Cours, devoirs, évaluations, notes et bulletins prennent de la valeur quand ils restent reliés à la classe et au parcours.</div><div className={styles.pedagogyEditorialBody}><p>Le travail académique n’est pas une extension de l’administration. Il possède sa temporalité, ses objets et ses responsabilités.</p><p>SANILA doit permettre aux équipes pédagogiques de suivre la progression sans reconstruire le contexte de chaque classe.</p><p>L’expérience enseignant reste distincte de la direction et de la famille, tout en participant à la même continuité institutionnelle.</p><p>Les résultats et bulletins ne sont pas des sorties isolées : ils prolongent le travail mené pendant la période.</p></div></div></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="02" eyebrow="DU COURS AU BULLETIN" title="Une séquence académique cohérente." /><ProcessSequence steps={page.workflow} variant="journey" /></section>
    <section className={styles.section}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section>
    <ClosingStatement page={page} title="Explorer SANILA depuis le travail réel des équipes pédagogiques." />
  </>
}
