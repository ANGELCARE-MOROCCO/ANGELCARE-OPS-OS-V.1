import Link from 'next/link'
import { getSanilaPublicPage, sanilaHref } from '../content'
import { ClosingStatement, DomainNavigation, EditorialLead, ExecutiveSignalBoard, OutcomeStrip, ProcessSequence, SectionHeading, SourceTruth } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function DirectionPage() {
  const page = getSanilaPublicPage('direction')!
  return <>
    <section className={styles.directionHero}>
      <div className={styles.directionHeroCopy}><span>DIRECTION / COMMAND</span><h1>{page.title}</h1><p>{page.subtitle}</p><Link href={sanilaHref('demonstration')}>Voir SANILA avec votre réalité de direction →</Link></div>
      <div className={styles.directionHeroBoard}><ExecutiveSignalBoard /></div>
    </section>
    <OutcomeStrip page={page} />
    <section className={styles.section}><SectionHeading index="01" eyebrow="SIGNAL → DÉCISION" title="La direction n’a pas besoin d’un écran spectaculaire. Elle a besoin d’une lecture institutionnelle." body="Chaque signal doit pouvoir descendre dans le détail opérationnel puis revenir à une vision consolidée sans perdre sa provenance." /><div className={styles.directionSignals}><div className={styles.directionSignalsQuote}>« Voir l’établissement sans demander à cinq personnes de reconstruire sa situation. »</div><div className={styles.directionSignalsBody}>{['Présences du jour','Admissions en mouvement','Soldes à suivre','Opérations transport','Incidents & réclamations','Restitution de gestion'].map((x,i)=><div key={x}><span>0{i+1}</span><strong>{x}</strong></div>)}</div></div></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="02" eyebrow="BOUCLE DE PILOTAGE" title="Du signal à la décision, puis de la décision à la trace." /><ProcessSequence steps={page.workflow} variant="vertical" /></section>
    <section className={styles.section}><SourceTruth page={page} /></section>
    <section className={`${styles.section} ${styles.sectionCompact}`}><DomainNavigation current="direction" /></section>
    <ClosingStatement page={page} title="La direction doit pouvoir ouvrir SANILA et comprendre où regarder en premier." />
  </>
}
