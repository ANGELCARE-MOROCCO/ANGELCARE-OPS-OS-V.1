'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Boxes,
  FilePlus2,
  FileStack,
  Globe2,
  ImagePlus,
  Languages,
  LayoutTemplate,
  Menu,
  PanelBottom,
  RefreshCcw,
  Rocket,
  Search,
  ShoppingBag,
  UsersRound,
  WandSparkles,
} from 'lucide-react'
import type { FrontendSurfaceRecord, SurfaceStatus, SurfaceType } from '../types'
import { SURFACE_BY_KEY } from '../surface-registry'
import styles from '../total-commerce-control.module.css'

type Snapshot = {
  surfaces: FrontendSurfaceRecord[]
  metrics: {
    surfaces: number
    published: number
    products: number
    categories: number
    pages: number
    openInquiries: number
  }
}

const boutiqueTools = [
  ['/angelcare-marketplace/admin/homepage', 'Homepage', 'Hero, sections, placements, preview et historique.', LayoutTemplate],
  ['/angelcare-marketplace/admin/experience/pages', 'Pages & content', 'Registre, Page 360, builder et publication CMS.', FileStack],
  ['/angelcare-marketplace/admin/media', 'Media Library', 'Assets, droits, transformations et usages.', ImagePlus],
  ['/angelcare-marketplace/admin/navigation/header', 'Navigation Studio', 'Header, mega-menu, mobile et publication.', Menu],
  ['/angelcare-marketplace/admin/footer-studio', 'Footer Studio', 'Profils, composition, ciblage, planning et versions.', PanelBottom],
  ['/angelcare-marketplace/admin/frontend-experiences/surfaces', 'Frontend Surfaces', 'Identifier le studio canonique de chaque route publique.', Globe2],
  ['/angelcare-marketplace/admin/localization', 'Localization', 'Couverture, traductions, RTL, SEO et readiness.', Languages],
  ['/angelcare-marketplace/admin/publication', 'Publication', 'Événements, versions, refresh et rollback.', Rocket],
] as const

const continuityTools = [
  ['/angelcare-marketplace/admin/catalog/items', 'Produits', Boxes],
  ['/angelcare-marketplace/admin/orders', 'Commandes', ShoppingBag],
  ['/angelcare-marketplace/admin/customers/commerce', 'Customer Commerce', UsersRound],
  ['/angelcare-marketplace/admin/public-inquiries', 'Entrées commerciales', FilePlus2],
] as const

function studioHref(surface: FrontendSurfaceRecord) {
  if (surface.admin_studio_key === 'homepage' || surface.surface_key === 'homepage') return '/angelcare-marketplace/admin/homepage'
  if (surface.admin_studio_key === 'navigation' || surface.surface_type === 'navigation') return '/angelcare-marketplace/admin/navigation/header'
  if (surface.admin_studio_key === 'footer' || surface.surface_type === 'footer') return '/angelcare-marketplace/admin/footer-studio'
  if (surface.admin_studio_key === 'category' || surface.surface_type === 'category') return '/angelcare-marketplace/admin/catalog/categories'
  return `/angelcare-marketplace/admin/frontend-experiences/surfaces/${surface.surface_key}`
}

function previewHref(surface: FrontendSurfaceRecord) {
  return SURFACE_BY_KEY.get(surface.surface_key)?.previewPath || surface.route_pattern.replace(':locale', 'fr')
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('fr-FR') : 'Non publiée'
}

export function FrontendControlCommand({ snapshot }: { snapshot: Snapshot }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | SurfaceType>('all')
  const [status, setStatus] = useState<'all' | SurfaceStatus>('all')
  const filtered = useMemo(() => snapshot.surfaces.filter((surface) => {
    const haystack = `${surface.title} ${surface.surface_key} ${surface.route_pattern} ${surface.renderer_key}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) &&
      (type === 'all' || surface.surface_type === type) &&
      (status === 'all' || surface.status === status)
  }), [query, snapshot.surfaces, status, type])
  const attention = snapshot.surfaces.filter((surface) => surface.status !== 'published')
  const m = snapshot.metrics

  return <main className={styles.root}>
    <header className={styles.boutiqueHeader}>
      <div>
        <span className={styles.eyebrow}>BOUTIQUE · STOREFRONT CONTROL</span>
        <h1>Centre de pilotage storefront</h1>
        <p>Une vue unifiée des surfaces publiques, contenus, navigation, média, localisation et publication.</p>
      </div>
      <div className={styles.headerActions}>
        <Link href="/angelcare-marketplace/admin/experience/pages/new"><FilePlus2 size={16}/>Nouvelle page</Link>
        <Link href="/angelcare-marketplace/admin/media"><ImagePlus size={16}/>Médiathèque</Link>
        <Link data-primary href="/angelcare-marketplace/admin/publication"><Rocket size={16}/>Publication</Link>
      </div>
    </header>

    <section className={styles.boutiqueMetrics} aria-label="État storefront">
      {[
        ['Surfaces', m.surfaces, 'autorités enregistrées'],
        ['Publiées', m.published, 'actuellement live'],
        ['Brouillons / pauses', m.surfaces - m.published, 'à qualifier'],
        ['Pages CMS', m.pages, 'contenus administrables'],
        ['Produits', m.products, 'objets reliés'],
        ['Catégories', m.categories, 'storefronts reliés'],
      ].map(([label, value, hint]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}
    </section>

    <section className={styles.boutiqueLayout}>
      <div className={styles.surfaceRegistry}>
        <header>
          <div><span className={styles.eyebrow}>PUBLIC SURFACE REGISTRY</span><h2>Surfaces storefront</h2></div>
          <strong>{filtered.length} / {snapshot.surfaces.length}</strong>
        </header>
        <div className={styles.registryToolbar}>
          <label><Search size={15}/><span className="sr-only">Rechercher une surface</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Surface, route, renderer…"/></label>
          <select aria-label="Type de surface" value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="all">Tous les types</option>{['homepage','marketplace','category','vertical','product','transactional','navigation','footer','portal','system'].map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="Statut" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Tous les statuts</option>{['draft','published','paused','archived'].map((value) => <option key={value}>{value}</option>)}</select>
          <button type="button" onClick={() => { setQuery(''); setType('all'); setStatus('all') }}><RefreshCcw size={14}/>Réinitialiser</button>
        </div>
        <div className={styles.surfaceTableWrap}>
          <table className={styles.surfaceTable}>
            <thead><tr><th>Surface</th><th>Type / renderer</th><th>Route publique</th><th>Statut</th><th>Publication</th><th>Preview</th><th>Action</th></tr></thead>
            <tbody>{filtered.map((surface) => <tr key={surface.id}>
              <td><strong>{surface.title}</strong><small>{surface.surface_key}</small></td>
              <td>{surface.surface_type}<small>{surface.renderer_key}</small></td>
              <td><code>{surface.route_pattern}</code></td>
              <td><span className={styles.status} data-status={surface.status}>{surface.status}</span></td>
              <td>{formatDate(surface.published_at)}<small>{surface.locale_mode} · territoire {surface.territory_mode}</small></td>
              <td><a className={styles.iconLink} href={previewHref(surface)} target="_blank" rel="noreferrer" aria-label={`Prévisualiser ${surface.title}`}><ArrowUpRight size={15}/></a></td>
              <td><Link className={styles.openLink} href={studioHref(surface)}>Ouvrir</Link></td>
            </tr>)}</tbody>
          </table>
          {!filtered.length ? <div className={styles.empty}>Aucune surface ne correspond aux filtres. Réinitialisez la recherche pour retrouver le registre complet.</div> : null}
        </div>
      </div>

      <aside className={styles.boutiqueRail}>
        <section><header><span>PRIORITÉS BOUTIQUE</span><strong>{attention.length}</strong></header>{attention.slice(0, 6).map((surface) => <Link key={surface.id} href={studioHref(surface)}><i data-status={surface.status}/><span><strong>{surface.title}</strong><small>{surface.status} · {surface.route_pattern}</small></span><ArrowUpRight size={14}/></Link>)}{!attention.length ? <p>Toutes les surfaces enregistrées sont publiées.</p> : null}</section>
        <section><header><span>ACCÈS BOUTIQUE</span></header>{boutiqueTools.map(([href, label, copy, Icon]) => <Link href={href} key={href}><Icon size={16}/><span><strong>{label}</strong><small>{copy}</small></span><ArrowUpRight size={14}/></Link>)}</section>
        <section><header><span>CONTINUITÉ COMMERCE</span></header>{continuityTools.map(([href, label, Icon]) => <Link href={href} key={href}><Icon size={16}/><span><strong>{label}</strong></span><ArrowUpRight size={14}/></Link>)}</section>
        <section className={styles.doctrine}><WandSparkles size={18}/><strong>Une seule autorité publique</strong><p>Les studios éditent le contenu autour des renderers réels; ils ne dupliquent jamais leur logique transactionnelle.</p></section>
      </aside>
    </section>
  </main>
}
