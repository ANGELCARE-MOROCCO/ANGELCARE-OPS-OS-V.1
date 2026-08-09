import Link from 'next/link'
import { Boxes, CircleAlert, GalleryHorizontalEnd, ImagePlus, LayoutDashboard, Megaphone, Menu, PackagePlus, RefreshCcw, Sparkles, Tags } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CommerceStudioData } from '../types'

const studios = [
  ['/angelcare-marketplace/admin/media','Media Library','Uploader, recadrer, réutiliser et gouverner tous les médias.',ImagePlus],
  ['/angelcare-marketplace/admin/homepage/composer','Homepage Designer 2.0','Canvas visuel, category-aware, responsive et publication instantanée.',LayoutDashboard],
  ['/angelcare-marketplace/admin/category-native','Category-Native Engine','Schémas, studios verticaux et CSV Factory par archétype.',Sparkles],
  ['/angelcare-marketplace/admin/navigation/header','Navigation Studio','Contrôler header, mega-menu, mobile et footer.',Menu],
  ['/angelcare-marketplace/admin/catalog/items/new','Product Studio','Créer produits, services, kits, programmes, plans et variantes.',PackagePlus],
  ['/angelcare-marketplace/admin/catalog/categories/new','Category Studio','Créer hiérarchies, storefronts et assignations produits.',Tags],
  ['/angelcare-marketplace/admin/merchandising','Merchandising Studio','Featured, Popular, Best Picks, collections et calendriers.',Megaphone],
  ['/angelcare-marketplace/admin/publication','Publication Orchestrator','Publier, rafraîchir, comparer et restaurer immédiatement.',RefreshCcw],
] as const

export function CommerceStudioCommand({ data }: { data: CommerceStudioData }) {
  const s = data.summary
  const metrics = [
    ['Sections live',s.liveHomepageSections],['Campagnes actives',s.activeCampaigns],['Produits publiés',s.publishedProducts],
    ['Catégories publiées',s.publishedCategories],['Navigation active',s.activeNavigationItems],['Médias actifs',s.mediaAssets],
  ]
  const gaps = [
    ['Sans média',s.missingMedia],['Sans prix',s.missingPrice],['Sans catégorie',s.missingCategory],['Traduction incomplète',s.missingTranslation],
  ]
  return <main className={styles.shell}>
    <section className={styles.commandHero}>
      <div><span>ANGELCARE COMMERCE STUDIO · NO-CODE CONTROL</span><h1>Admin décide.<br/>Admin exécute.<br/>Le Marketplace répond maintenant.</h1><p>Une seule autorité pour les médias, la homepage, la navigation, le catalogue, les catégories, le merchandising et la publication immédiate.</p></div>
      <div className={styles.heroSignal}><Sparkles size={30}/><strong>LIVE</strong><span>Administration autonome</span></div>
    </section>
    <section className={styles.metricRail}>{metrics.map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className={styles.studioGrid}>{studios.map(([href,title,copy,Icon])=><Link href={href} key={href}><Icon size={25}/><span>ENTERPRISE STUDIO</span><h2>{title}</h2><p>{copy}</p><b>Ouvrir →</b></Link>)}</section>
    <section className={styles.splitCommand}>
      <div className={styles.panel}><header><div><span>PUBLICATION HEALTH</span><h2>Qualité commerciale immédiate</h2></div><CircleAlert size={22}/></header><div className={styles.gapGrid}>{gaps.map(([label,value])=><Link href="/angelcare-marketplace/admin/catalog/items" key={label} data-risk={Number(value)>0}><strong>{value}</strong><span>{label}</span></Link>)}</div></div>
      <div className={styles.panel}><header><div><span>MERCHANDISING LIVE</span><h2>Distribution commerciale</h2></div><GalleryHorizontalEnd size={22}/></header><div className={styles.merchNumbers}><div><b>{s.featuredProducts}</b><span>Featured</span></div><div><b>{s.popularProducts}</b><span>Popular</span></div><div><b>{s.bestPickProducts}</b><span>Best Picks</span></div><div><b>{s.availableNowProducts}</b><span>Available Now</span></div></div></div>
    </section>
    <section className={styles.panel}><header><div><span>RECENT PUBLICATION</span><h2>Résultats appliqués</h2></div><Boxes size={21}/></header><div className={styles.recordRows}>{s.recentPublications.length?s.recentPublications.map((event)=><div key={event.id}><div><strong>{String(event.object_type||'commerce')}</strong><span>{String(event.action||'updated')}</span></div><b>{String(event.status||'completed')}</b></div>):<div className={styles.empty}>Les publications apparaîtront ici avec les routes rafraîchies et l’audit associé.</div>}</div></section>
  <section className={styles.enterpriseUtilities}><div><span>ENTERPRISE ACCELERATORS</span><h2>Import, export et publication instantanée</h2><p>Modèles structurés, dry-run, erreurs par ligne et exécution auditable.</p></div><div><a href="/api/angelcare-marketplace/admin/commerce/export/catalog-items">Exporter le catalogue CSV</a><a href="/angelcare-marketplace/admin/commerce-studio/import-export">Ouvrir Import / Export</a></div></section></main>
}
