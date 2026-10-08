import Link from 'next/link'
import { PRODUCT_DOMAINS, getSanilaPublicPage, sanilaHref } from '../content'
import { ClosingStatement, EditorialLead, SectionHeading } from '../components/SanilaExperience'
import { SanilaIcon } from '../SanilaIcon'
import styles from '../SanilaPublic.module.css'

export function FeaturesPage() {
  const page = getSanilaPublicPage('fonctionnalites')!
  return <>
    <EditorialLead page={page} index="01" label="ATLAS DES CAPACITÉS" />
    <section className={styles.section}><SectionHeading index="02" eyebrow="LIRE PAR RESPONSABILITÉ" title="Un atlas, pas un mur de fonctionnalités." body="Chaque domaine existe parce qu’une responsabilité réelle doit être exécutée, contrôlée ou comprise." /><div className={styles.solutionTriptych}>{PRODUCT_DOMAINS.slice(0,3).map((d)=><Link href={sanilaHref(d.slug)} key={d.slug}><span>{d.eyebrow}</span><h2>{d.nav}</h2><p>{d.outcome}</p><ul>{d.features.slice(0,5).map(f=><li key={f}>{f}</li>)}</ul><strong>Explorer <SanilaIcon name="arrow" size={14}/></strong></Link>)}</div></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><div className={styles.solutionTriptych}>{PRODUCT_DOMAINS.slice(3,6).map((d)=><Link href={sanilaHref(d.slug)} key={d.slug}><span>{d.eyebrow}</span><h2>{d.nav}</h2><p>{d.outcome}</p><ul>{d.features.slice(0,5).map(f=><li key={f}>{f}</li>)}</ul><strong>Explorer <SanilaIcon name="arrow" size={14}/></strong></Link>)}</div></section>
    <section className={styles.section}><div className={styles.domainNavigationGrid}>{PRODUCT_DOMAINS.slice(6).map((d)=><Link key={d.slug} href={sanilaHref(d.slug)}><SanilaIcon name="layers" size={16}/><span>{d.nav}</span><SanilaIcon name="arrow" size={13}/></Link>)}</div></section>
    <ClosingStatement page={page} title="Utiliser l’atlas comme point d’entrée vers les workflows qui comptent." />
  </>
}
