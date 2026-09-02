import { getSanilaPublicPage } from '../content'
import { EvidenceLedger } from '../components/SanilaExperience'
import { OnboardingLaunchMap } from '../components/SanilaVisualSystems'
import { SanilaOnboardingForm } from '../SanilaOnboardingForm'
import styles from '../SanilaPublic.module.css'
export function OnboardingPage(){const page=getSanilaPublicPage('creer-mon-etablissement')!;return <>
<section className={styles.serviceHero}><div><span>PRÉPARER MON ÉTABLISSEMENT</span><h1>Commencer la mise en service sans créer un environnement production incontrôlé.</h1><p>Ce parcours prépare une revue AngelCare : il structure le contexte de l’établissement, son périmètre et son calendrier avant toute décision de création d’environnement.</p></div><div className={styles.serviceHeroAside}><strong>Soumettre ≠ créer. La validation humaine reste une frontière produit.</strong></div></section>
<section className={`${styles.section} ${styles.sectionSoft}`}><OnboardingLaunchMap/></section>
<section className={styles.demoFormStage}><aside className={styles.demoFormAside}><span>PRÉPARATION GUIDÉE</span><h2>Transformer une intention commerciale en dossier de préparation.</h2><p>Le parcours distingue organisation, structure, volume, domaines souhaités, calendrier et responsable. Aucun environnement production n’est créé automatiquement.</p><EvidenceLedger sources={page.evidenceSources}/></aside><SanilaOnboardingForm/></section></>}
