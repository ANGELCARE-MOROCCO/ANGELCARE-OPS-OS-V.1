import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, OutcomeStrip, SectionHeading } from '../components/SanilaExperience'
import { AttendancePulseVisual, VisualSignalRail } from '../components/SanilaVisualSystems'
import styles from '../SanilaPublic.module.css'

export function AttendancePage(){const page=getSanilaPublicPage('presences')!;return <>
  <section className={styles.domainEditorialHero}><div className={styles.domainEditorialNumber}>07:55</div><div className={styles.domainEditorialCopy}><span>PRÉSENCES / AUJOURD’HUI</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></section>
  <OutcomeStrip page={page}/>
  <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="LECTURE DU MATIN" title="Une présence doit être rapide à enregistrer et précise à relire." body="Le visuel ci-dessous est un schéma qualitatif : il distingue les états sans inventer de volumes réels."/><div className={styles.homeSystemStage}><AttendancePulseVisual/></div></section>
  <section className={styles.section}><VisualSignalRail items={[
    {icon:'check',label:'Présent',detail:'État simple, sans friction inutile.'},
    {icon:'clock',label:'Retard',detail:'Distinct d’une absence et porteur de contexte.'},
    {icon:'users',label:'Absent',detail:'Suivi identifiable quand une action est requise.'},
    {icon:'file',label:'Justifié',detail:'Le motif reste attaché à la trace.'},
    {icon:'building',label:'Classe',detail:'Lecture collective sans perdre l’individu.'},
    {icon:'chart',label:'Direction',detail:'Restitution du jour compréhensible.'},
  ]}/></section>
  <section className={`${styles.section} ${styles.sectionSoft}`}><div className={styles.domainSplit}><CapabilityIndex page={page} columns={2}/><EvidenceLedger sources={page.evidenceSources}/></div></section>
  <ClosingStatement page={page}/>
</>}
