import { getSanilaPublicPage } from '../content'
import { EvidenceLedger } from '../components/SanilaExperience'
import { SanilaDemoForm } from '../SanilaDemoForm'
import styles from '../SanilaPublic.module.css'
export function DemoPage(){const page=getSanilaPublicPage('demonstration')!;return <>
<section className={styles.serviceHero}><div><span>DÉMONSTRATION / QUALIFICATION</span><h1>Une démonstration doit partir de votre établissement, pas de notre script.</h1><p>Structure, outils actuels, priorités, volume, calendrier et rôle du décideur déterminent ce que nous devons vous montrer.</p></div><div className={styles.serviceHeroAside}><strong>Nous préférons une démonstration ciblée à une visite guidée de cinquante écrans.</strong></div></section>
<section className={styles.section}><div className={styles.formExperience}><aside className={styles.formExperienceIntro}><span>AVANT LA DÉMO</span><h2>Qualifier pour montrer moins, mais montrer juste.</h2><p>Le parcours ci-contre transforme votre contexte en ordre du jour commercial. Aucune création automatique d’environnement n’est déclenchée.</p><EvidenceLedger sources={page.evidenceSources}/></aside><SanilaDemoForm/></div></section></>}
