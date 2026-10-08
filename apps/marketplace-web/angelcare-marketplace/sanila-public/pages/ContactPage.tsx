import { getSanilaPublicPage } from '../content'
import { EvidenceLedger } from '../components/SanilaExperience'
import { CommunicationNetworkVisual, VisualSignalRail } from '../components/SanilaVisualSystems'
import { SanilaContactForm } from '../SanilaContactForm'
import styles from '../SanilaPublic.module.css'
export function ContactPage(){const page=getSanilaPublicPage('contact')!;return <>
<section className={styles.demoHeroMaster}><div className={styles.demoHeroCopy}><span>CONTACT / INTENTION D’ABORD</span><h1>Quel sujet voulez-vous réellement faire avancer ?</h1><p>Commercial, démonstration, tarification, mise en service, partenariat ou avant-vente : l’intention doit déterminer le circuit, pas l’inverse.</p><div className={styles.demoHeroChips}><span>Un point d’entrée</span><span>Une intention explicite</span><span>Une prise en charge orientée</span></div></div><div className={styles.demoHeroVisual}><CommunicationNetworkVisual/></div></section>
<section className={styles.demoScopeSection}><VisualSignalRail items={[
{icon:'message',label:'Commercial',detail:'Parler besoin, périmètre et décision.'},{icon:'spark',label:'Démonstration',detail:'Préparer une preuve produit ciblée.'},{icon:'wallet',label:'Tarifs',detail:'Qualifier avant de chiffrer.'},{icon:'layers',label:'Mise en service',detail:'Parler calendrier et préparation.'},{icon:'users',label:'Partenariat',detail:'Orienter vers la bonne relation.'},{icon:'search',label:'Avant-vente',detail:'Clarifier l’architecture avant décision.'}]}/></section>
<section className={styles.demoFormStage}><aside className={styles.demoFormAside}><span>ORIENTATION</span><h2>Le contact n’est pas une boîte aux lettres.</h2><p>La demande reste reliée à l’autorité publique Marketplace existante. Aucun backend parallèle n’est créé.</p><EvidenceLedger sources={page.evidenceSources}/></aside><SanilaContactForm/></section></>}
