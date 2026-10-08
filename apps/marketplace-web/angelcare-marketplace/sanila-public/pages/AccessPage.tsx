import { getSanilaPublicPage } from '../content'
import { EvidenceLedger, RoleAccessDoors } from '../components/SanilaExperience'
import { ProductEvidenceMosaic, VisualSignalRail } from '../components/SanilaVisualSystems'
import styles from '../SanilaPublic.module.css'
export function AccessPage(){const page=getSanilaPublicPage('connexion')!;return <>
<section className={styles.accessHero}><div className={styles.accessHeroInner}><span>ACCÈS SANILA / LOBBY SÉCURISÉ</span><h1>Une institution. Six portes d’entrée. Des responsabilités distinctes.</h1><p>Choisissez l’espace correspondant à votre rôle. Les accès publics conduisent uniquement aux autorités utilisateurs réelles ; l’Operator interne AngelCare reste invisible.</p></div></section>
<section className={`${styles.section} ${styles.sectionSoft}`}><ProductEvidenceMosaic/></section>
<section className={styles.accessDoorsSection}><RoleAccessDoors/></section>
<section className={styles.section}><VisualSignalRail items={[
{icon:'building',label:'Établissement',detail:'Administration et exploitation institutionnelle.'},{icon:'layers',label:'Portail',detail:'Accès établissement dédié.'},{icon:'book',label:'Enseignant',detail:'Classes, pédagogie et évaluations.'},{icon:'users',label:'Personnel',detail:'Exécution et responsabilités terrain.'},{icon:'heart',label:'Parent',detail:'Relation famille et informations autorisées.'},{icon:'spark',label:'Élève',detail:'Expérience contrôlée selon politique.'}]}/></section>
<section className={`${styles.section} ${styles.sectionSoft}`}><div className={styles.domainSplit}><div className={styles.domainManifesto}>La cohérence du produit n’exige pas que chaque rôle vive dans la même interface.</div><EvidenceLedger sources={page.evidenceSources} title="Autorités d’accès vérifiées"/></div></section></>}
