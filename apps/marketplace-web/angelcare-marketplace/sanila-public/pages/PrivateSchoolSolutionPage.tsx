import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, InstitutionalContextBand, OutcomeStrip, SectionHeading, StructureTreeVisual } from '../components/SanilaExperience'
import { SolutionOperatingProfile, VisualSignalRail } from '../components/SanilaVisualSystems'
import styles from '../SanilaPublic.module.css'
export function PrivateSchoolSolutionPage(){const page=getSanilaPublicPage('solutions/ecoles-privees')!;return <>
<section className={styles.solutionHeroInstitution}><div><span className={styles.kicker}>ÉCOLES PRIVÉES</span><h1>{page.title}</h1><p>{page.subtitle}</p></div><SolutionOperatingProfile title="École privée" icon="building" items={['Direction','Administration','Admissions','Pédagogie','Finance','Familles','Personnel','Rapports']}/></section><OutcomeStrip page={page}/>
<section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="01" eyebrow="COMPLEXITÉ UTILE" title="Structurer l’établissement sans casser les métiers."/><div className={styles.pagePatternGrid}><StructureTreeVisual/><InstitutionalContextBand title="Une seule institution, plusieurs cadences." items={['Rentrée','Périodes','Cours','Évaluations','Mensualités','Relances','Réunions familles','Transport']}/></div></section>
<section className={styles.section}><VisualSignalRail items={[
{icon:'chart',label:'Direction',detail:'Lecture transversale de l’établissement.'},{icon:'building',label:'Administration',detail:'Structure scolaire et dossiers.'},{icon:'users',label:'Admissions',detail:'Pipeline et inscription.'},{icon:'book',label:'Pédagogie',detail:'Classes, matières et évaluations.'},{icon:'wallet',label:'Finance',detail:'Facturation, paiements et soldes.'},{icon:'heart',label:'Familles',detail:'Information et confiance.'}]}/></section>
<section className={`${styles.section} ${styles.sectionSoft}`}><CapabilityIndex page={page} columns={4}/></section><ClosingStatement page={page}/></>}
