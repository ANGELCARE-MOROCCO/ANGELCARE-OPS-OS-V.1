import { getSanilaPublicPage } from '../content'
import { EvidenceLedger, RoleAccessDoors } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'
export function AccessPage(){const page=getSanilaPublicPage('connexion')!;return <>
<section className={styles.accessHero}><div className={styles.accessHeroInner}><span>ACCÈS SANILA / LOBBY SÉCURISÉ</span><h1>Une institution. Six portes d’entrée. Des responsabilités distinctes.</h1><p>Choisissez l’espace correspondant à votre rôle. Les accès publics conduisent uniquement aux autorités utilisateurs réelles ; l’Operator interne AngelCare reste invisible.</p></div></section>
<section className={styles.accessDoorsSection}><RoleAccessDoors/></section>
<section className={`${styles.section} ${styles.sectionSoft}`}><div className={styles.domainSplit}><div className={styles.domainManifesto}>La cohérence du produit n’exige pas que chaque rôle vive dans la même interface.</div><EvidenceLedger sources={page.evidenceSources} title="Autorités d’accès vérifiées"/></div></section></>}
