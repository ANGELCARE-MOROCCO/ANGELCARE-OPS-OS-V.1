import Link from 'next/link'
import { getSanilaPublicPage, sanilaHref } from '../content'
import { ClosingStatement, SectionHeading } from '../components/SanilaExperience'
import { SolutionOperatingProfile } from '../components/SanilaVisualSystems'
import { SanilaIcon } from '../SanilaIcon'
import styles from '../SanilaPublic.module.css'

export function SolutionsPage(){const page=getSanilaPublicPage('solutions')!;const sols=[
  ['01','Crèches & maternelles','Confiance famille, routines, présence, équipes, paiements et sécurité.','solutions/creches-maternelles',['Familles','Routines','Présences','Finance']],
  ['02','Écoles privées','Administration, pédagogie, finance, familles et reporting dans une même continuité.','solutions/ecoles-privees',['Administration','Pédagogie','Finance','Familles']],
  ['03','Groupes scolaires','Standards communs, exécution locale, multi-sites, gouvernance et visibilité groupe.','solutions/groupes-scolaires',['Multi-sites','Gouvernance','Standards','Reporting']],
];return <>
  <section className={styles.solutionsHero}><span>SOLUTIONS / CONTEXTE INSTITUTIONNEL</span><h1>{page.title}</h1><p>{page.subtitle}</p></section>
  <section className={`${styles.section} ${styles.sectionInk}`}><SectionHeading index="01" eyebrow="TROIS MODÈLES D’EXPLOITATION" title="Le contexte institutionnel change la manière dont le système doit être raconté."/><div className={styles.pagePatternGridThree}><SolutionOperatingProfile title="Crèches & maternelles" icon="heart" items={['Familles','Routines','Présences','Équipe','Paiements','Sécurité']}/><SolutionOperatingProfile title="Écoles privées" icon="building" items={['Administration','Admissions','Pédagogie','Finance','Familles','Rapports']}/><SolutionOperatingProfile title="Groupes scolaires" icon="layers" items={['Standards','Sites','Délégation','Gouvernance','Reporting','Cohérence']}/></div></section>
  <section className={styles.section}><SectionHeading index="02" eyebrow="QUESTION D’ACHAT" title="SANILA est-il conçu pour une institution comme la mienne ?" body="La réponse ne se trouve pas dans une liste de fonctionnalités, mais dans la façon dont le système épouse le modèle d’exploitation de l’établissement."/><div className={styles.solutionTriptych}>{sols.map(([n,t,d,s,items])=><Link href={sanilaHref(s as string)} key={t as string}><span>{n as string}</span><h2>{t as string}</h2><p>{d as string}</p><ul>{(items as string[]).map(x=><li key={x}>{x}</li>)}</ul><strong>Explorer ce contexte <SanilaIcon name="arrow" size={14}/></strong></Link>)}</div></section>
  <ClosingStatement page={page} title="Choisir le contexte qui ressemble le plus à votre réalité opérationnelle." />
</>}
