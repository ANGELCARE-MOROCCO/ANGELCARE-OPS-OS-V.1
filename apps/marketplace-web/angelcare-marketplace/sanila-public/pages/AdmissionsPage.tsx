import Image from 'next/image'
import { getSanilaPublicPage } from '../content'
import { AdmissionsJourneyVisual, CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function AdmissionsPage() {
  const page = getSanilaPublicPage('admissions')!
  return <>
    <section className={styles.admissionsHero}>
      <div className={styles.admissionsHeroCopy}><span>ADMISSIONS / PARCOURS FAMILLE</span><h1>{page.title}</h1><p>{page.subtitle}</p></div>
      <div className={styles.admissionsHeroPhoto}><Image src={page.contextualImage!} alt={page.contextualImageAlt!} fill sizes="35vw" priority /></div>
      <div className={styles.admissionsHeroJourney}><AdmissionsJourneyVisual /></div>
    </section>
    <OutcomeStrip page={page} />
    <section className={styles.admissionsStory}><SectionHeading index="01" eyebrow="CONTINUITÉ DU DOSSIER" title="La famille ne devrait jamais recommencer son histoire à chaque service." /><div className={styles.admissionsStoryGrid}><div className={styles.admissionsStoryText}><blockquote>« La conversion commerciale devient une continuité administrative quand le dossier reste relié. »</blockquote><p>Demande, visite, documents, qualification, décision, inscription, classe et relation financière doivent former une seule trajectoire lisible. C’est cette continuité qui protège l’expérience famille et la qualité d’exécution.</p></div><EvidenceLedger sources={page.evidenceSources} title="Pipeline, dossier, documents et conversion" /></div></section>
    <section className={styles.section}><SectionHeading index="02" eyebrow="CAPACITÉS" title="Ce qui compte est moins le nombre d’écrans que le maintien du contexte." /><CapabilityIndex page={page} columns={3} /></section>
    <ClosingStatement page={page} title="Faire entrer vos admissions dans une logique de dossier, pas de mémoire." />
  </>
}
