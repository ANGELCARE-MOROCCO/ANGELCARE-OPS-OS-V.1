'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpDown, Eye, FileText, FilterX, Languages, Plus, Search, SlidersHorizontal } from 'lucide-react'
import type { CmsPage } from '../types'
import styles from '../experience.module.css'

interface Props {
  pages: CmsPage[]
  canCreate?: boolean
}

export function PageRegistry({ pages, canCreate = false }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [locale, setLocale] = useState('all')
  const [translation, setTranslation] = useState('all')
  const [sort, setSort] = useState<'updated' | 'title' | 'status'>('updated')
  const [selectedId, setSelectedId] = useState(pages[0]?.id || '')

  const visible = useMemo(() => {
    const filtered = pages.filter((page) => {
      const haystack = `${page.title} ${page.slug} ${page.route_key} ${page.public_reference}`.toLowerCase()
      return (!query || haystack.includes(query.toLowerCase()))
        && (status === 'all' || page.status === status)
        && (locale === 'all' || page.locale === locale)
        && (translation === 'all' || page.translation_status === translation)
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'fr')
      if (sort === 'status') return a.status.localeCompare(b.status)
      return Date.parse(b.updated_at) - Date.parse(a.updated_at)
    })
  }, [locale, pages, query, sort, status, translation])
  const selected = pages.find((page) => page.id === selectedId) || visible[0] || null
  const reviewCount = pages.filter((page) => ['submitted', 'in_review', 'approved'].includes(page.status)).length
  const localizationRisk = pages.filter((page) => ['missing', 'stale'].includes(page.translation_status)).length
  const scheduled = pages.filter((page) => page.status === 'scheduled').length
  const filtersActive = Boolean(query || status !== 'all' || locale !== 'all' || translation !== 'all')

  function clearFilters() {
    setQuery('')
    setStatus('all')
    setLocale('all')
    setTranslation('all')
  }

  return (
    <main className={styles.registryWorkspace}>
      <section className={styles.registryMetrics}>
        <article><FileText size={17}/><div><strong>{pages.length}</strong><span>pages gouvernées</span></div></article>
        <article><Eye size={17}/><div><strong>{pages.filter((page) => page.status === 'published').length}</strong><span>publiées</span></div></article>
        <article><SlidersHorizontal size={17}/><div><strong>{reviewCount}</strong><span>dans le runway</span></div></article>
        <article data-risk={localizationRisk > 0}><Languages size={17}/><div><strong>{localizationRisk}</strong><span>risques de traduction</span></div></article>
      </section>

      <section className={styles.registryCommandBar}>
        <label className={styles.registrySearch}><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Page, route, slug ou référence…" aria-label="Rechercher les pages"/></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrer par statut">
          <option value="all">Tous les statuts</option><option value="draft">Brouillon</option><option value="submitted">Soumis</option><option value="in_review">En revue</option><option value="approved">Approuvé</option><option value="scheduled">Planifié</option><option value="published">Publié</option><option value="retired">Retiré</option><option value="archived">Archivé</option>
        </select>
        <select value={locale} onChange={(event) => setLocale(event.target.value)} aria-label="Filtrer par locale"><option value="all">FR · EN · AR</option><option value="fr">FR</option><option value="en">EN</option><option value="ar">AR</option></select>
        <select value={translation} onChange={(event) => setTranslation(event.target.value)} aria-label="Filtrer par traduction"><option value="all">Toutes traductions</option><option value="source">Source FR</option><option value="missing">Manquante</option><option value="draft">Brouillon</option><option value="reviewed">Revue</option><option value="approved">Approuvée</option><option value="stale">Périmée</option></select>
        <label className={styles.sortControl}><ArrowUpDown size={14}/><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Trier les pages"><option value="updated">Dernière modification</option><option value="title">Titre</option><option value="status">Statut</option></select></label>
        {filtersActive ? <button type="button" className={styles.clearFilters} onClick={clearFilters}><FilterX size={14}/> Effacer</button> : null}
        {canCreate ? <Link className={styles.primary} href="/angelcare-marketplace/admin/experience/pages/new"><Plus size={15}/> Nouvelle page</Link> : <button type="button" className={styles.primary} disabled title="Permission marketplace.cms.create requise"><Plus size={15}/> Nouvelle page</button>}
      </section>

      <section className={styles.registrySplit}>
        <div className={styles.registryTablePanel}>
          <header><div><span>CONTENT PORTFOLIO</span><strong>{visible.length} résultat(s)</strong></div><small>Tri {sort} · sélection contextuelle conservée</small></header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Page / route</th><th>Locale</th><th>Territoire</th><th>Version</th><th>Traduction</th><th>Statut</th><th>Commande</th></tr></thead>
              <tbody>{visible.map((page) => (
                <tr key={page.id} data-selected={page.id === selected?.id} onClick={() => setSelectedId(page.id)}>
                  <td className={styles.titleCell}><strong>{page.title}</strong><span>/{page.locale}/{page.slug} · {page.public_reference}</span></td>
                  <td>{page.locale.toUpperCase()}</td><td>{page.territory_id || 'Global'}</td>
                  <td>v{page.current_version}{page.published_version ? ` · live v${page.published_version}` : ''}</td>
                  <td><span className={styles.status} data-status={page.translation_status}>{page.translation_status}</span></td>
                  <td><span className={styles.status} data-status={page.status}>{page.status}</span></td>
                  <td><Link href={`/angelcare-marketplace/admin/experience/pages/${page.id}`}>Dossier</Link> · <Link href={`/angelcare-marketplace/admin/experience/pages/${page.id}/builder`}>Builder</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {!visible.length ? <div className={styles.empty}><FilterX size={22}/><strong>Aucune page ne correspond</strong><span>Effacez les filtres ou créez une page gouvernée.</span></div> : null}
        </div>

        <aside className={styles.registryInspector}>
          {selected ? <>
            <span>PAGE QUICK DOSSIER</span><h2>{selected.title}</h2><code>{selected.public_reference}</code>
            <dl>
              <div><dt>Route</dt><dd>/{selected.locale}/{selected.slug}</dd></div>
              <div><dt>Lifecycle</dt><dd>{selected.status}</dd></div>
              <div><dt>Traduction</dt><dd>{selected.translation_status}</dd></div>
              <div><dt>Version</dt><dd>v{selected.current_version}{selected.published_version ? ` / live v${selected.published_version}` : ''}</dd></div>
              <div><dt>Planification</dt><dd>{selected.scheduled_at || 'Non planifiée'}</dd></div>
              <div><dt>Propriétaire</dt><dd>{selected.owner_id || 'Non assigné'}</dd></div>
            </dl>
            {['missing', 'stale'].includes(selected.translation_status) ? <p className={styles.inspectorWarning}><AlertTriangle size={15}/> Traduction incompatible avec une publication sûre.</p> : null}
            <div className={styles.inspectorActions}>
              <Link className={styles.primary} href={`/angelcare-marketplace/admin/experience/pages/${selected.id}`}>Ouvrir le 360</Link>
              <Link className={styles.secondary} href={`/angelcare-marketplace/admin/experience/pages/${selected.id}/builder`}>Composer</Link>
              {selected.status === 'published' ? <a className={styles.secondary} href={`/angelcare-marketplace/${selected.locale}/${selected.slug}`} target="_blank">Voir public</a> : null}
            </div>
          </> : <div className={styles.empty}>Sélectionnez une page.</div>}
          <section className={styles.runwaySummary}><strong>Runway Boutique</strong><span>{scheduled} planifiée(s)</span><span>{reviewCount} en validation</span><span>{localizationRisk} risque(s) linguistique(s)</span></section>
        </aside>
      </section>
    </main>
  )
}
