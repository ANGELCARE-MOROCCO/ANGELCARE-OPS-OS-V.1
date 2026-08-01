import Link from 'next/link'
import { Blocks, Menu, MousePointerClick, Rocket, ScanEye, Waypoints } from 'lucide-react'
import type { CmsPage, PublicationJob } from '../types'
import styles from '../experience.module.css'

const commands = [
  { href: '/angelcare-marketplace/admin/experience/pages', title: 'Registre des expériences', text: 'Pages localisées, versions, propriétaires et statut de publication.', icon: Waypoints },
  { href: '/angelcare-marketplace/admin/experience/block-library', title: 'Bibliothèque de blocs', text: 'Composants éditoriaux validés, sensibles et orientés conversion.', icon: Blocks },
  { href: '/angelcare-marketplace/admin/experience/menus', title: 'Architecture de navigation', text: 'Menus par locale, territoire, audience et visibilité.', icon: Menu },
  { href: '/angelcare-marketplace/admin/experience/ctas', title: 'Registre des CTA', text: 'Actions connectées à des routes et événements mesurables.', icon: MousePointerClick },
  { href: '/angelcare-marketplace/admin/experience/publishing', title: 'Runway de publication', text: 'Validation, planification, blocage et rollback.', icon: Rocket },
  { href: '/angelcare-marketplace/admin/experience/pages', title: 'Prévisualisation gouvernée', text: 'Aperçu temporaire avant publication, sans exposition publique.', icon: ScanEye },
]

export function ExperienceCommand({ pages, jobs }: { pages: CmsPage[]; jobs: PublicationJob[] }) {
  const published = pages.filter((page) => page.status === 'published').length
  const review = pages.filter((page) => ['submitted','in_review','approved','scheduled'].includes(page.status)).length
  const blocked = jobs.filter((job) => job.status === 'blocked').length
  return <div className={styles.experience}>
    <section className={styles.hero}><div><span>EXPERIENCE GOVERNANCE · ORIGINAL MZ 05</span><h1>Construire le public sans perdre le contrôle.</h1><p>Chaque page est localisée, versionnée, prévisualisable, approuvable, publiable et restaurable. Les équipes métier opèrent le contenu sans modifier le code.</p></div><div className={styles.heroMap}><div className={styles.heroNode}><strong>{pages.length} pages gouvernées</strong><span>Inclut les brouillons et pages archivées.</span></div><div className={styles.heroNode}><strong>{published} pages publiées</strong><span>Uniquement les versions ayant passé les contrôles.</span></div><div className={styles.heroNode}><strong>{review} en contrôle</strong><span>Soumises, révisées, approuvées ou planifiées.</span></div><div className={styles.heroNode}><strong>{blocked} publication(s) bloquée(s)</strong><span>Un blocage reste visible jusqu’à correction.</span></div></div></section>
    <section className={styles.commandGrid}>{commands.map(({href,title,text,icon:Icon})=><Link href={href} className={styles.commandCard} key={title}><Icon size={23}/><strong>{title}</strong><p>{text}</p><span>Ouvrir le workspace →</span></Link>)}</section>
  </div>
}
