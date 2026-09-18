import Link from 'next/link'
import {
  Blocks, Boxes, Braces, FileStack, GalleryHorizontalEnd, Globe2, HeartPulse, Languages, Menu, Network,
  Rocket, Route, ShieldCheck, Sparkles, Waypoints,
} from 'lucide-react'
import type { CmsPage, PublicationJob } from '../types'
import styles from '../experience.module.css'

const commands = [
  { href: '/angelcare-marketplace/admin/experience/studio', title: 'Marketplace Studio', text: 'Composition visuelle Puck, import universel, preview sécurisé et publication gouvernée.', icon: Blocks, tone: 'blue' },
  { href: '/angelcare-marketplace/admin/experience/pages', title: 'Pages', text: 'Identités stables, brouillons, révisions, routes et publication.', icon: Waypoints, tone: 'blue' },
  { href: '/angelcare-marketplace/admin/experience/block-library', title: 'Blocs', text: 'Contrat canonique, champs, design, bindings et readiness runtime.', icon: Blocks, tone: 'sky' },
  { href: '/angelcare-marketplace/admin/experience/templates', title: 'Templates', text: 'Créer depuis une composition versionnée sans générer de code caché.', icon: FileStack, tone: 'violet' },
  { href: '/angelcare-marketplace/admin/experience/symbols', title: 'Symboles', text: 'Contenu global réutilisable, versionné et publié explicitement.', icon: Boxes, tone: 'indigo' },
  { href: '/angelcare-marketplace/admin/experience/dependencies', title: 'Graphe & Where Used', text: 'Dépendances page, média, liens, commerce, templates et symboles.', icon: Network, tone: 'teal' },
  { href: '/angelcare-marketplace/admin/experience/menus', title: 'Navigation CMS', text: 'Menus CMS stables par page, locale et territoire.', icon: Menu, tone: 'cyan' },
  { href: '/angelcare-marketplace/admin/navigation', title: 'Navigation native', text: 'Réutilise le Navigation OS existant au lieu de créer une seconde autorité.', icon: Route, tone: 'green' },
  { href: '/angelcare-marketplace/admin/configuration/web-presence', title: 'SEO / Web Presence', text: 'Réutilise l’autorité native Search, Social, Browser, PWA et domaines.', icon: Globe2, tone: 'emerald' },
  { href: '/angelcare-marketplace/admin/localization', title: 'Localisation', text: 'Réutilise l’autorité FR/EN/AR, territoires et fraîcheur existante.', icon: Languages, tone: 'amber' },
  { href: '/angelcare-marketplace/admin/media', title: 'Media Library', text: 'Assets stables, droits, variantes, optimisation et usages.', icon: GalleryHorizontalEnd, tone: 'orange' },
  { href: '/angelcare-marketplace/admin/experience/publishing', title: 'Releases', text: 'Publication exacte, scheduling, exécution worker et rollback.', icon: Rocket, tone: 'red' },
  { href: '/angelcare-marketplace/admin/experience/health', title: 'Health', text: 'Readiness, références, jobs, registry et risques sans blocage monolithique.', icon: HeartPulse, tone: 'rose' },
  { href: '/angelcare-marketplace/admin/experience/developer', title: 'Developer', text: 'Contrats TXT/CSV/JSON, hashes et registration manuelle zéro AI embarquée.', icon: Braces, tone: 'slate' },
]

export function ExperienceCommand({ pages, jobs }: { pages: CmsPage[]; jobs: PublicationJob[] }) {
  const published = pages.filter(page => page.publication_state === 'published' || page.status === 'published').length
  const drafts = pages.filter(page => page.current_version !== page.published_version).length
  const scheduled = jobs.filter(job => ['queued','ready','validating'].includes(job.status)).length
  const failed = jobs.filter(job => ['blocked','failed'].includes(job.status)).length
  return <div className={styles.experienceCommandV2}>
    <section className={styles.experienceHeroV2}>
      <div className={styles.experienceHeroCopy}><span><Sparkles size={14}/> EXPERIENCE OPERATING CORE</span><h1>Composer avec puissance. Publier avec certitude.</h1><p>Le système natif devient l’autorité transactionnelle des révisions, médias, dépendances, templates, symboles et releases — tout en conservant les moteurs Marketplace déjà opérationnels.</p><div className={styles.experiencePrinciples}><em><ShieldCheck size={14}/> Aucun brouillon implicite en production</em><em><Network size={14}/> Dépendances visibles avant impact</em><em><Globe2 size={14}/> Autorités natives réutilisées</em></div></div>
      <div className={styles.experienceMetricPanel}><div><span>Portfolio</span><strong>{pages.length}</strong><small>pages gouvernées</small></div><div><span>Public</span><strong>{published}</strong><small>pages publiées</small></div><div><span>Draft delta</span><strong>{drafts}</strong><small>draft ≠ published</small></div><div data-alert={failed > 0}><span>Release queue</span><strong>{scheduled}</strong><small>{failed} bloqué/échoué</small></div></div>
    </section>
    <section className={styles.experienceWorkspaceHeader}><div><span>WORKSPACES</span><h2>Une seule autorité Experience, des outils spécialisés.</h2></div><p>Les workspaces existants de Media, Navigation, Localisation et Web Presence restent natifs. Experience Studio les orchestre au lieu de les dupliquer.</p></section>
    <section className={styles.experienceWorkspaceGrid}>{commands.map(({ href, title, text, icon: Icon, tone }) => <Link href={href} className={styles.experienceWorkspaceCard} data-tone={tone} key={title}><div className={styles.workspaceIcon}><Icon size={19}/></div><div><strong>{title}</strong><p>{text}</p></div><span>Ouvrir →</span></Link>)}</section>
  </div>
}
