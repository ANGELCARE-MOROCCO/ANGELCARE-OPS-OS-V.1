import { getSanilaPublicPage } from '../content'
import { EvidenceLedger } from '../components/SanilaExperience'
import { SanilaContactForm } from '../SanilaContactForm'
import styles from '../SanilaPublic.module.css'
export function ContactPage(){const page=getSanilaPublicPage('contact')!;return <>
<section className={styles.serviceHero}><div><span>CONTACT / INTENTION D’ABORD</span><h1>Quel sujet voulez-vous réellement faire avancer ?</h1><p>Commercial, démonstration, tarification, mise en service, partenariat ou avant-vente : l’intention doit déterminer le circuit, pas l’inverse.</p></div><div className={styles.serviceHeroAside}><strong>Le contact n’est pas une boîte aux lettres. C’est le début d’une prise en charge.</strong></div></section>
<section className={styles.section}><div className={styles.formExperience}><aside className={styles.formExperienceIntro}><span>ORIENTATION</span><h2>Un seul point d’entrée, plusieurs intentions explicites.</h2><p>La demande reste reliée à l’autorité publique Marketplace existante. Aucun backend parallèle n’est créé.</p><EvidenceLedger sources={page.evidenceSources}/></aside><SanilaContactForm/></div></section></>}
