'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ChangeEvent, DragEvent, ReactNode } from 'react'
import {
  Download,
  ExternalLink,
  Eye,
  GripVertical,
  History,
  LayoutTemplate,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
} from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CatalogAdminItem, CatalogCategoryAdmin, MediaAsset } from '../types'
import {
  apiRequest,
  CommerceActionDialog,
  Field,
  SelectField,
  StudioForm,
  StudioNotice,
  TextArea,
  useStudioMutation,
} from './StudioClient'

type CategoryTab = 'identity' | 'storefront' | 'filters' | 'products' | 'preview'

interface CategoryStudioProps {
  initialCategories: CatalogCategoryAdmin[]
  items: CatalogAdminItem[]
  media: MediaAsset[]
  category?: CatalogCategoryAdmin | null
  initialTab?: CategoryTab
  startNew?: boolean
  canManage?: boolean
  canExport?: boolean
  canViewHistory?: boolean
}

const obj = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value)
  ? value as Record<string, unknown>
  : {}
const str = (value: unknown) => typeof value === 'string' ? value : ''
const csv = (value: unknown) => Array.isArray(value) ? value.map(String).join(', ') : str(value)
const publicHref = (category: CatalogCategoryAdmin) =>
  `/angelcare-marketplace/fr/marketplace/category/${category.category_key || category.slug}`
const categoryHref = (categoryId: string, tab: CategoryTab) => {
  const base = `/angelcare-marketplace/admin/catalog/categories/${categoryId}`
  if (tab === 'storefront') return `${base}/storefront`
  if (tab === 'filters') return `${base}/seo`
  if (tab === 'products' || tab === 'preview') return `${base}/products`
  return base
}

function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return <header className={styles.categoryPageHeading}>
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {actions ? <div className={styles.categoryHeadingActions}>{actions}</div> : null}
  </header>
}

function depthOf(category: CatalogCategoryAdmin, byId: Map<string, CatalogCategoryAdmin>) {
  let depth = 0
  let cursor = category.parent_category_id
  const visited = new Set<string>()
  while (cursor && depth < 5 && !visited.has(cursor)) {
    visited.add(cursor)
    depth += 1
    cursor = byId.get(cursor)?.parent_category_id || null
  }
  return depth
}

function CategoryTree({
  categories,
  selectedId,
  query,
  onQuery,
  canManage,
  onDragStart,
  onDrop,
}: {
  categories: CatalogCategoryAdmin[]
  selectedId?: string
  query: string
  onQuery: (value: string) => void
  canManage: boolean
  onDragStart: (id: string) => void
  onDrop: (id: string) => void
}) {
  const byId = useMemo(() => new Map(categories.map((entry) => [entry.id, entry])), [categories])
  return <aside className={styles.categoryTree} aria-label="Architecture des catégories">
    <header>
      <div><span>ARCHITECTURE CATÉGORIE</span><strong>Arbre storefront</strong></div>
      {canManage
        ? <Link className={styles.categoryIconLink} href="/angelcare-marketplace/admin/catalog/categories/new" aria-label="Créer une catégorie"><Plus size={15}/></Link>
        : <button type="button" disabled title="Permission marketplace.categories.manage requise" aria-label="Création non autorisée"><Plus size={15}/></button>}
    </header>
    <label className={styles.assignmentSearch}>
      <Search size={15}/>
      <span className={styles.srOnly}>Rechercher une catégorie</span>
      <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => onQuery(event.target.value)} placeholder="Rechercher une catégorie…"/>
    </label>
    <div className={styles.categoryTreeRows}>
      {categories.map((entry) => {
        const depth = depthOf(entry, byId)
        return <Link
          href={categoryHref(entry.id, 'identity')}
          key={entry.id}
          draggable={canManage}
          data-selected={selectedId === entry.id}
          style={{ paddingInlineStart: 10 + depth * 15 }}
          onDragStart={() => onDragStart(entry.id)}
          onDragOver={(event: DragEvent<HTMLAnchorElement>) => { if (canManage) event.preventDefault() }}
          onDrop={() => onDrop(entry.id)}
        >
          <GripVertical size={14} aria-hidden/>
          <div>
            <strong>{entry.title}</strong>
            <span>{entry.item_count} produits · {entry.status}</span>
          </div>
        </Link>
      })}
      {!categories.length ? <div className={styles.categoryEmpty}>Aucune catégorie ne correspond à la recherche.</div> : null}
    </div>
    <p className={styles.categoryTreeHint}>
      {canManage
        ? 'Glisser-déposer persiste immédiatement l’ordre canonique.'
        : 'Lecture seule · marketplace.categories.manage est requise pour réordonner.'}
    </p>
  </aside>
}

function CategoryTabs({
  category,
  active,
  onPreview,
}: {
  category: CatalogCategoryAdmin
  active: CategoryTab
  onPreview: () => void
}) {
  const tabs: Array<[CategoryTab, string]> = [
    ['identity', 'Identité'],
    ['storefront', 'Storefront'],
    ['filters', 'Discovery'],
    ['products', 'Produits'],
  ]
  return <nav className={styles.categoryTabs} aria-label="Sections du dossier catégorie">
    {tabs.map(([key, label]) => <Link key={key} href={categoryHref(category.id, key)} data-active={active === key}>{label}</Link>)}
    <button type="button" data-active={active === 'preview'} onClick={onPreview}>Preview</button>
  </nav>
}

function PublicSummary({ category }: { category: CatalogCategoryAdmin }) {
  return <aside className={styles.categoryPublicSummary}>
    <span>RÉSUMÉ PUBLIC</span>
    <h2>État storefront</h2>
    <div className={styles.categorySummaryPreview} style={category.cover_asset_url ? { backgroundImage: `linear-gradient(180deg,rgba(7,27,53,.08),rgba(7,27,53,.72)),url("${category.cover_asset_url}")` } : undefined}>
      <b>{category.title}</b>
      <p>{category.short_description || 'Aucune introduction storefront.'}</p>
      <a href={publicHref(category)} target="_blank" rel="noreferrer">Explorer <ExternalLink size={13}/></a>
    </div>
    <dl className={styles.categorySummaryFacts}>
      <div><dt>Template</dt><dd>{category.storefront_template}</dd></div>
      <div><dt>Thème</dt><dd>{category.visual_theme}</dd></div>
      <div><dt>Visibilité</dt><dd data-status={category.status}>{category.status}</dd></div>
      <div><dt>Produits</dt><dd>{category.item_count}</dd></div>
    </dl>
    <p className={styles.categoryInfo}>Les images sont sélectionnées depuis la Media Library existante.</p>
  </aside>
}

function CategoryExperienceEditor({
  category,
  onSaved,
  canManage,
}: {
  category: CatalogCategoryAdmin
  onSaved: (record: CatalogCategoryAdmin) => void
  canManage: boolean
}) {
  const hero = obj(category.hero_content)
  const experience = obj(category.experience_config)
  const [values, setValues] = useState<Record<string, unknown>>({
    hero_eyebrow: str(hero.eyebrow),
    hero_title: str(hero.title) || category.title,
    hero_lead: str(hero.lead) || category.short_description || '',
    hero_cta_label: str(hero.cta_label) || 'Explorer',
    hero_cta_href: str(hero.cta_href),
    search_placeholder: str(experience.search_placeholder) || 'Que recherchez-vous ?',
    featured_title: str(experience.featured_title) || 'Sélection mise en avant',
    inventory_title: str(experience.inventory_title) || 'Tout découvrir',
    editorial_title: str(experience.editorial_title),
    editorial_body: str(experience.editorial_body),
    closing_title: str(experience.closing_title),
    closing_lead: str(experience.closing_lead),
    closing_cta_label: str(experience.closing_cta_label),
    closing_cta_href: str(experience.closing_cta_href),
  })
  const mutation = useStudioMutation()

  async function save() {
    const hero_content = {
      eyebrow: values.hero_eyebrow,
      title: values.hero_title,
      lead: values.hero_lead,
      cta_label: values.hero_cta_label,
      cta_href: values.hero_cta_href,
    }
    const experience_config = {
      ...experience,
      search_placeholder: values.search_placeholder,
      featured_title: values.featured_title,
      inventory_title: values.inventory_title,
      editorial_title: values.editorial_title,
      editorial_body: values.editorial_body,
      closing_title: values.closing_title,
      closing_lead: values.closing_lead,
      closing_cta_label: values.closing_cta_label,
      closing_cta_href: values.closing_cta_href,
    }
    const storefront_sections = [
      { key: 'editorial', type: 'editorial', title: values.editorial_title, body: values.editorial_body, visible: Boolean(values.editorial_title || values.editorial_body) },
      { key: 'closing', type: 'cta', title: values.closing_title, body: values.closing_lead, cta_label: values.closing_cta_label, cta_href: values.closing_cta_href, visible: Boolean(values.closing_title || values.closing_lead) },
    ]
    const result = await mutation.run(
      () => apiRequest<{ record: CatalogAdminItem }>(
        `/api/angelcare-marketplace/admin/commerce/catalog-categories/${category.id}`,
        { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hero_content, experience_config, storefront_sections }) },
      ),
      'Storefront enregistré et propagé vers l’autorité Commerce.',
    )
    if (result) onSaved(result.record as unknown as CatalogCategoryAdmin)
  }

  function field(key: string, label: string, textarea = false) {
    return <label className={styles.field}>
      <span>{label}</span>
      {textarea
        ? <textarea rows={4} value={String(values[key] ?? '')} disabled={!canManage} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}/>
        : <input value={String(values[key] ?? '')} disabled={!canManage} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}/>}
    </label>
  }

  return <section className={styles.categoryStorefrontLayout}>
    <div className={styles.categoryStorefrontCanvas}>
      <header>
        <div><span>STOREFRONT CANVAS</span><strong>{category.title} · Vue desktop</strong></div>
        <div><b>Desktop</b><b>FR</b><b data-live={category.status === 'published'}>{category.status === 'published' ? 'LIVE' : category.status}</b></div>
      </header>
      <div className={styles.categoryBrowser}>
        <div className={styles.categoryBrowserBar}>••• <span>{publicHref(category)}</span></div>
        <section className={styles.categoryHeroPreview}>
          <small>{String(values.hero_eyebrow || 'CATÉGORIE')}</small>
          <h2>{String(values.hero_title || category.title)}</h2>
          <p>{String(values.hero_lead || 'Introduction storefront à compléter.')}</p>
          <b>{String(values.hero_cta_label || 'Explorer')}</b>
        </section>
        <div className={styles.categorySearchPreview}>{String(values.search_placeholder || 'Rechercher…')}</div>
        <span className={styles.categoryPreviewLabel}>{String(values.featured_title || 'Sélection mise en avant')}</span>
        <div className={styles.categoryCardPreview}><i/><i/><i/></div>
        <article className={styles.categoryEditorialPreview}>
          <strong>{String(values.editorial_title || 'Bloc éditorial')}</strong>
          <p>{String(values.editorial_body || 'Le contenu éditorial administrable apparaîtra ici.')}</p>
        </article>
        <article className={styles.categoryClosingPreview}>
          <div><strong>{String(values.closing_title || 'Besoin d’aide ?')}</strong><p>{String(values.closing_lead || 'Notre équipe vous accompagne.')}</p></div>
          <b>{String(values.closing_cta_label || 'Nous contacter')}</b>
        </article>
      </div>
    </div>
    <aside className={styles.categoryInspector}>
      <header><div><span>INSPECTOR</span><h2>Hero & contenu public</h2></div><LayoutTemplate size={22}/></header>
      {field('hero_eyebrow', 'Eyebrow')}
      {field('hero_title', 'Titre hero', true)}
      {field('hero_lead', 'Introduction hero', true)}
      <div className={styles.formGrid}>{field('hero_cta_label', 'CTA hero')}{field('hero_cta_href', 'Destination CTA')}</div>
      {field('search_placeholder', 'Placeholder recherche')}
      <div className={styles.formGrid}>{field('featured_title', 'Titre sélection')}{field('inventory_title', 'Titre inventaire')}</div>
      <span className={styles.categoryInspectorSection}>SECTIONS PUBLIQUES</span>
      {field('editorial_title', 'Titre éditorial')}
      {field('editorial_body', 'Bloc éditorial', true)}
      <div className={styles.formGrid}>{field('closing_title', 'Titre fermeture')}{field('closing_cta_label', 'CTA final')}</div>
      {field('closing_lead', 'Texte fermeture', true)}
      {field('closing_cta_href', 'Destination finale')}
      <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
      <button className={styles.primaryAction} type="button" disabled={!canManage || mutation.saving} title={!canManage ? 'Permission marketplace.categories.manage requise' : undefined} onClick={() => void save()}>
        <LayoutTemplate size={16}/> Enregistrer le storefront
      </button>
    </aside>
  </section>
}

function CategoryDiscoveryEditor({
  category,
  onSaved,
  canManage,
}: {
  category: CatalogCategoryAdmin
  onSaved: (record: CatalogCategoryAdmin) => void
  canManage: boolean
}) {
  const filters = obj(category.filter_config)
  const [values, setValues] = useState({
    filterKeys: csv(filters.filter_keys),
    sortOptions: csv(filters.sort_options) || 'recommended, newest, price_asc, price_desc',
    showFeatured: filters.show_featured !== false,
    showCollections: filters.show_collections !== false,
    seoTitle: str(category.seo_metadata?.title_fr),
    seoDescription: str(category.seo_metadata?.description_fr),
  })
  const mutation = useStudioMutation()
  const exposedFilters = values.filterKeys.split(',').map((value) => value.trim()).filter(Boolean)

  async function save() {
    const filter_config = {
      filter_keys: exposedFilters,
      sort_options: values.sortOptions.split(',').map((value) => value.trim()).filter(Boolean),
      show_featured: values.showFeatured,
      show_collections: values.showCollections,
    }
    const seo_metadata = { ...obj(category.seo_metadata), title_fr: values.seoTitle, description_fr: values.seoDescription }
    const result = await mutation.run(
      () => apiRequest<{ record: CatalogAdminItem }>(
        `/api/angelcare-marketplace/admin/commerce/catalog-categories/${category.id}`,
        { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ filter_config, seo_metadata }) },
      ),
      'Discovery et SEO enregistrés.',
    )
    if (result) onSaved(result.record as unknown as CatalogCategoryAdmin)
  }

  return <div className={styles.categoryDiscoveryGrid}>
    <section className={styles.categoryDiscoveryEditor}>
      <header><span>DISCOVERY CONTROL</span><h2>Filtres, tris & merchandising natif</h2><p>Les attributs produit alimentent les facettes réelles. Admin choisit uniquement les contrôles exposés.</p></header>
      <label className={styles.field}><span>Filtres exposés · séparés par virgule</span><textarea rows={3} disabled={!canManage} value={values.filterKeys} onChange={(event) => setValues((current) => ({ ...current, filterKeys: event.target.value }))}/></label>
      <label className={styles.field}><span>Tris exposés</span><input disabled={!canManage} value={values.sortOptions} onChange={(event) => setValues((current) => ({ ...current, sortOptions: event.target.value }))}/></label>
      <div className={styles.discoverySwitches}>
        <label><div><strong>Sélection featured</strong><span>Afficher la sélection éditoriale au-dessus de l’inventaire</span></div><input type="checkbox" disabled={!canManage} checked={values.showFeatured} onChange={(event) => setValues((current) => ({ ...current, showFeatured: event.target.checked }))}/></label>
        <label><div><strong>Collections</strong><span>Afficher les collections actives liées à la catégorie</span></div><input type="checkbox" disabled={!canManage} checked={values.showCollections} onChange={(event) => setValues((current) => ({ ...current, showCollections: event.target.checked }))}/></label>
      </div>
      <span className={styles.categoryInspectorSection}>EXEMPLE DE FILTRES PUBLICS</span>
      <div className={styles.discoveryChips}>{exposedFilters.map((filter) => <b key={filter}>{filter.replaceAll('_', ' ')}</b>)}</div>
      <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
      <button className={styles.primaryAction} type="button" disabled={!canManage || mutation.saving} title={!canManage ? 'Permission marketplace.categories.manage requise' : undefined} onClick={() => void save()}>
        <SlidersHorizontal size={16}/> Enregistrer Discovery & SEO
      </button>
    </section>
    <aside className={styles.categorySeoInspector}>
      <header><div><span>SEO COMMERCIAL</span><h2>Prévisualisation</h2></div><b>Indexable</b></header>
      <label className={styles.field}><span>SEO title</span><input disabled={!canManage} value={values.seoTitle} onChange={(event) => setValues((current) => ({ ...current, seoTitle: event.target.value }))}/></label>
      <label className={styles.field}><span>SEO description</span><textarea rows={4} disabled={!canManage} value={values.seoDescription} onChange={(event) => setValues((current) => ({ ...current, seoDescription: event.target.value }))}/></label>
      <span className={styles.categoryInspectorSection}>SNIPPET</span>
      <article className={styles.seoSnippet}>
        <strong>{values.seoTitle || `${category.title} | AngelCare`}</strong>
        <small>my.angelcarehub.com › marketplace › category</small>
        <p>{values.seoDescription || category.short_description || 'Description SEO à compléter.'}</p>
      </article>
      <p className={styles.categoryInfo}>Aucun score SEO artificiel : seuls les champs réellement persistés sont exposés.</p>
    </aside>
  </div>
}

export function CategoryStudio({
  initialCategories,
  items,
  media,
  category,
  initialTab = 'identity',
  startNew = false,
  canManage = false,
  canExport = false,
  canViewHistory = false,
}: CategoryStudioProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [selected, setSelected] = useState<CatalogCategoryAdmin | null>(category || null)
  const [assigned, setAssigned] = useState<string[]>(() => Array.isArray(category?.items) ? category.items.map((entry) => String(entry.catalog_item_id)) : [])
  const [categoryQuery, setCategoryQuery] = useState('')
  const [itemQuery, setItemQuery] = useState('')
  const [dragged, setDragged] = useState<string | null>(null)
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null)
  const [tab, setTab] = useState<CategoryTab>(initialTab)
  const mutation = useStudioMutation()

  const allFrenchCategories = useMemo(
    () => categories.filter((entry) => entry.locale === 'fr').sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  )
  const visibleCategories = useMemo(
    () => allFrenchCategories.filter((entry) => `${entry.title} ${entry.category_key} ${entry.slug}`.toLowerCase().includes(categoryQuery.toLowerCase())),
    [allFrenchCategories, categoryQuery],
  )
  const assignedItems = assigned.map((id) => items.find((item) => item.id === id)).filter((item): item is CatalogAdminItem => Boolean(item))
  const visibleItems = useMemo(
    () => items.filter((item) => `${item.name_fr} ${item.public_reference} ${item.sku || ''}`.toLowerCase().includes(itemQuery.toLowerCase())),
    [items, itemQuery],
  )

  async function assignProducts() {
    if (!selected || !canManage) return
    await mutation.run(
      () => apiRequest(`/api/angelcare-marketplace/admin/commerce/catalog-categories/${selected.id}/assign-products`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item_ids: assigned }),
      }),
      'Produits assignés et storefront rafraîchi.',
    )
  }

  function reorderAssigned(targetId: string) {
    if (!canManage || !draggedProduct || draggedProduct === targetId) return
    setAssigned((current) => {
      const next = [...current]
      const from = next.indexOf(draggedProduct)
      const to = next.indexOf(targetId)
      if (from < 0 || to < 0) return current
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDraggedProduct(null)
  }

  async function reorder(targetId: string) {
    if (!canManage || !dragged || dragged === targetId) return
    const previous = categories
    const ordered = [...allFrenchCategories]
    const from = ordered.findIndex((entry) => entry.id === dragged)
    const to = ordered.findIndex((entry) => entry.id === targetId)
    if (from < 0 || to < 0) return
    const [moved] = ordered.splice(from, 1)
    ordered.splice(to, 0, moved)
    const sortMap = new Map(ordered.map((entry, index) => [entry.id, index * 10]))
    setCategories((current) => current.map((entry) => sortMap.has(entry.id) ? { ...entry, sort_order: sortMap.get(entry.id) || 0 } : entry))
    const result = await mutation.run(
      () => apiRequest('/api/angelcare-marketplace/admin/catalog/categories/reorder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ordered_ids: ordered.map((entry) => entry.id) }),
      }),
      'Ordre canonique des catégories enregistré.',
    )
    if (!result) setCategories(previous)
    setDragged(null)
  }

  function mergeSaved(next: CatalogCategoryAdmin) {
    setSelected(next)
    setCategories((current) => current.some((entry) => entry.id === next.id)
      ? current.map((entry) => entry.id === next.id ? next : entry)
      : [...current, next])
  }

  const tree = <CategoryTree
    categories={visibleCategories}
    selectedId={selected?.id}
    query={categoryQuery}
    onQuery={setCategoryQuery}
    canManage={canManage}
    onDragStart={setDragged}
    onDrop={(id) => void reorder(id)}
  />

  if (!selected && !startNew) {
    return <main className={styles.shell}>
      <PageHeading
        eyebrow="CATÉGORIES & COLLECTIONS"
        title="Catégories & collections"
        description="Pilotez la hiérarchie, la visibilité et l’expérience storefront de chaque catégorie depuis une architecture unique."
        actions={<>
          {canViewHistory
            ? <Link className={styles.secondaryActionLink} href="/angelcare-marketplace/admin/commerce-studio/publication"><History size={15}/> Historique</Link>
            : <button type="button" className={styles.secondaryActionLink} disabled title="Permission marketplace.publication.manage requise"><History size={15}/> Historique</button>}
          {canManage
            ? <Link className={styles.primaryActionLink} href="/angelcare-marketplace/admin/catalog/categories/new"><Plus size={15}/> Créer une catégorie</Link>
            : <button type="button" className={styles.primaryActionLink} disabled title="Permission marketplace.categories.manage requise"><Plus size={15}/> Créer une catégorie</button>}
        </>}
      />
      <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
      <section className={styles.categoryRegistryLayout}>
        {tree}
        <section className={styles.categoryRegistryPanel}>
          <header>
            <div><span>REGISTRE</span><h2>Catégories publiques</h2></div>
            <div className={styles.categoryRegistryControls}>
              <b>FR</b>
              <b data-live>{allFrenchCategories.filter((entry) => entry.status === 'published').length} publiées</b>
              {canExport
                ? <Link prefetch={false} href="/api/angelcare-marketplace/admin/commerce/export/catalog-categories"><Download size={14}/> Exporter</Link>
                : <button type="button" disabled title="Permission marketplace.commerce.export requise"><Download size={14}/> Exporter</button>}
            </div>
          </header>
          <div className={styles.categoryTableWrap}>
            <table className={styles.categoryTable}>
              <thead><tr><th>Catégorie</th><th>Clé / slug</th><th>Produits</th><th>Template storefront</th><th>Thème</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {visibleCategories.map((entry) => <tr key={entry.id}>
                  <td><strong>{entry.title}</strong><small>{entry.parent_category_id ? categories.find((parent) => parent.id === entry.parent_category_id)?.title || 'Sous-catégorie' : 'Racine'}</small></td>
                  <td>{entry.category_key}<small>{entry.slug}</small></td>
                  <td>{entry.item_count}</td>
                  <td>{entry.storefront_template}</td>
                  <td><b className={styles.categoryTheme}>{entry.visual_theme}</b></td>
                  <td><b className={styles.categoryStatus} data-status={entry.status}>{entry.status}</b></td>
                  <td><Link href={categoryHref(entry.id, 'identity')}>Ouvrir →</Link></td>
                </tr>)}
              </tbody>
            </table>
            {!visibleCategories.length ? <div className={styles.categoryEmpty}>Aucune catégorie ne correspond aux critères.</div> : null}
          </div>
        </section>
      </section>
    </main>
  }

  const headingTitle = !selected
    ? 'Créer une catégorie'
    : tab === 'storefront'
      ? 'Category Storefront Studio — Hero & contenu public'
      : tab === 'filters'
        ? 'Category Discovery & SEO Studio'
        : tab === 'products' || tab === 'preview'
          ? 'Composition produits & preview réelle'
          : 'Category 360 — Identité & présentation'
  const headingDescription = !selected
    ? 'Créez l’identité canonique en brouillon avant de composer le storefront et ses relations.'
    : tab === 'storefront'
      ? 'Éditez ce que le client voit réellement : hero, recherche, sections éditoriales et fermeture.'
      : tab === 'filters'
        ? 'Contrôlez les filtres, tris et métadonnées publiques réellement consommés par le storefront.'
        : tab === 'products' || tab === 'preview'
          ? 'Sélectionnez, ordonnez et synchronisez les produits, puis contrôlez le rendu public réel.'
          : 'Configurez l’autorité de catégorie, le template storefront, le thème et les médias sans toucher au code.'

  return <main className={styles.shell}>
    <PageHeading
      eyebrow="CATÉGORIES & COLLECTIONS"
      title={headingTitle}
      description={headingDescription}
      actions={selected ? <>
        <a className={styles.secondaryActionLink} href={publicHref(selected)} target="_blank" rel="noreferrer"><Eye size={15}/> Voir storefront</a>
        {tab === 'identity'
          ? <CommerceActionDialog
              resource="catalog-categories"
              id={selected.id}
              action={selected.status === 'published' ? 'unpublish' : 'publish'}
              label={selected.status === 'published' ? 'Dépublier' : 'Publier maintenant'}
              objectLabel={`${selected.title} · ${selected.category_key}`}
              currentState={selected.status}
              targetState={selected.status === 'published' ? 'paused' : 'published'}
              consequences={selected.status === 'published' ? 'La catégorie quitte les surfaces publiques après rafraîchissement ciblé. Les relations catalogue sont conservées.' : 'La catégorie devient consommable par le storefront public et les chemins affectés sont rafraîchis.'}
              reversible
              danger={selected.status === 'published'}
              disabled={!canManage}
              disabledReason="Permission marketplace.categories.manage requise"
              onDone={() => mergeSaved({ ...selected, status: selected.status === 'published' ? 'paused' : 'published' })}
            />
          : <button type="button" className={styles.primaryActionLink} disabled={!canManage} title={!canManage ? 'Permission marketplace.categories.manage requise' : undefined} onClick={() => {
              if (tab === 'storefront' || tab === 'filters') document.querySelector<HTMLButtonElement>(`.${styles.categoryInspector} .${styles.primaryAction}, .${styles.categoryDiscoveryEditor} .${styles.primaryAction}`)?.click()
              if (tab === 'products') void assignProducts()
            }}>{tab === 'products' ? 'Synchroniser' : 'Enregistrer'}</button>}
      </> : undefined}
    />
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>

    {!selected
      ? <section className={styles.categoryDossierLayout}>
          {tree}
          <section className={styles.categoryEditor}>
            <span>NEW CATEGORY</span>
            <h2>Identité canonique</h2>
            <StudioForm
              resource="catalog-categories"
              onSaved={(record) => mergeSaved(record as CatalogCategoryAdmin)}
              submitLabel="Créer la catégorie"
              disabled={!canManage}
              disabledReason="Permission marketplace.categories.manage requise"
            >
              <div className={styles.formGrid}><SelectField name="locale" label="Locale" defaultValue="fr" options={['fr', 'en', 'ar']}/><SelectField name="status" label="Statut initial" defaultValue="draft" options={['draft', 'published', 'paused', 'archived']}/></div>
              <Field name="title" label="Titre" required/>
              <TextArea name="short_description" label="Introduction storefront"/>
              <div className={styles.formGrid}><Field name="category_key" label="Clé"/><Field name="slug" label="Slug"/></div>
              <SelectField name="parent_category_id" label="Catégorie parente" options={[{ value: '', label: 'Racine' }, ...allFrenchCategories.map((entry) => ({ value: entry.id, label: entry.title }))]}/>
              <div className={styles.formGrid}><SelectField name="visual_theme" label="Thème" defaultValue="navy" options={['navy', 'warm', 'blue', 'red', 'gold', 'health', 'corporate', 'saas', 'quality', 'professional']}/><SelectField name="storefront_template" label="Template" defaultValue="mixed" options={['mixed', 'family-concierge', 'home-service-booking', 'developmental-discovery', 'product-commerce', 'academy-credential', 'institutional-transformation', 'hospitality-programme', 'health-adjacent', 'corporate-benefits', 'saas-commerce', 'quality-assessment', 'professional-marketplace']}/></div>
              <input type="hidden" name="visible" value="true"/>
            </StudioForm>
          </section>
          <aside className={styles.categoryPublicSummary}><span>READINESS</span><h2>Nouveau dossier</h2><p className={styles.categoryInfo}>Le storefront, Discovery, les produits et la preview seront activés après création de l’identifiant canonique.</p></aside>
        </section>
      : <>
          {tab === 'identity' || tab === 'filters'
            ? <section className={styles.categoryDossierLayout}>
                {tree}
                <section className={styles.categoryEditor}>
                  <CategoryTabs category={selected} active={tab} onPreview={() => setTab('preview')}/>
                  {tab === 'identity' ? <>
                    <span>EDIT CATEGORY</span>
                    <h2>{selected.title}</h2>
                    <StudioForm
                      resource="catalog-categories"
                      id={selected.id}
                      onSaved={(record) => mergeSaved(record as CatalogCategoryAdmin)}
                      submitLabel="Enregistrer"
                      disabled={!canManage}
                      disabledReason="Permission marketplace.categories.manage requise"
                    >
                      <div className={styles.formGrid}><SelectField name="locale" label="Locale" defaultValue={selected.locale} options={['fr', 'en', 'ar']}/><SelectField name="status" label="Statut" defaultValue={selected.status} options={['draft', 'published', 'paused', 'archived']}/></div>
                      <Field name="title" label="Titre" defaultValue={selected.title} required/>
                      <TextArea name="short_description" label="Introduction storefront" defaultValue={selected.short_description}/>
                      <div className={styles.formGrid}><Field name="category_key" label="Clé" defaultValue={selected.category_key}/><Field name="slug" label="Slug" defaultValue={selected.slug}/></div>
                      <SelectField name="parent_category_id" label="Catégorie parente" defaultValue={selected.parent_category_id} options={[{ value: '', label: 'Racine' }, ...allFrenchCategories.filter((entry) => entry.id !== selected.id).map((entry) => ({ value: entry.id, label: entry.title }))]}/>
                      <div className={styles.formGrid}><SelectField name="visual_theme" label="Thème" defaultValue={selected.visual_theme} options={['navy', 'warm', 'blue', 'red', 'gold', 'health', 'corporate', 'saas', 'quality', 'professional']}/><SelectField name="storefront_template" label="Template" defaultValue={selected.storefront_template} options={['mixed', 'family-concierge', 'home-service-booking', 'developmental-discovery', 'product-commerce', 'academy-credential', 'institutional-transformation', 'hospitality-programme', 'health-adjacent', 'corporate-benefits', 'saas-commerce', 'quality-assessment', 'professional-marketplace']}/></div>
                      <SelectField name="cover_asset_url" label="Cover desktop · Media Library" defaultValue={selected.cover_asset_url} options={[{ value: '', label: 'Aucune couverture' }, ...media.filter((asset) => asset.media_type === 'image').map((asset) => ({ value: asset.desktop_url, label: asset.file_name }))]}/>
                      <SelectField name="mobile_cover_asset_url" label="Cover mobile · Media Library" defaultValue={selected.mobile_cover_asset_url} options={[{ value: '', label: 'Dérivée automatiquement' }, ...media.filter((asset) => asset.media_type === 'image').map((asset) => ({ value: asset.mobile_url || asset.desktop_url, label: asset.file_name }))]}/>
                      <div className={styles.formGrid}><Field name="icon_key" label="Icône" defaultValue={selected.icon_key}/><Field name="sort_order" label="Ordre" type="number" defaultValue={selected.sort_order}/></div>
                      <input type="hidden" name="visible" value="true"/>
                    </StudioForm>
                  </> : <CategoryDiscoveryEditor category={selected} onSaved={mergeSaved} canManage={canManage}/>}
                </section>
                {tab === 'identity' ? <PublicSummary category={selected}/> : null}
              </section>
            : null}

          {tab === 'storefront' ? <>
            <CategoryTabs category={selected} active={tab} onPreview={() => setTab('preview')}/>
            <CategoryExperienceEditor category={selected} onSaved={mergeSaved} canManage={canManage}/>
          </> : null}

          {tab === 'products' ? <>
            <CategoryTabs category={selected} active={tab} onPreview={() => setTab('preview')}/>
            <section className={styles.categoryProductLayout}>
              <div className={styles.categoryProductMain}>
                <section className={styles.categoryProductPanel}>
                  <header><div><span>PRODUCT DISTRIBUTION</span><h2>Composition commerciale · {selected.title}</h2></div><b>{assignedItems.length} produits assignés</b></header>
                  <p className={styles.categoryInfo}>Glissez les produits pour définir l’ordre canonique, puis synchronisez la relation catalogue.</p>
                  <div className={styles.categoryProductRows}>
                    {assignedItems.map((item, index) => <article key={item.id} draggable={canManage} onDragStart={() => setDraggedProduct(item.id)} onDragOver={(event: DragEvent<HTMLElement>) => { if (canManage) event.preventDefault() }} onDrop={() => reorderAssigned(item.id)}>
                      <GripVertical size={14}/><strong>#{index + 1}</strong><div><b>{item.name_fr}</b><span>{item.public_reference}</span></div><b className={styles.categoryStatus} data-status={item.status}>{item.status}</b><button type="button" disabled={!canManage} onClick={() => setAssigned((current) => current.filter((id) => id !== item.id))}>Retirer</button>
                    </article>)}
                    {!assignedItems.length ? <div className={styles.categoryEmpty}>Aucun produit assigné. Utilisez le catalogue à droite.</div> : null}
                  </div>
                  <button type="button" className={styles.primaryAction} disabled={!canManage || mutation.saving} title={!canManage ? 'Permission marketplace.categories.manage requise' : undefined} onClick={() => void assignProducts()}><Tags size={16}/> Synchroniser {assigned.length} produits</button>
                </section>
                <section className={styles.categoryProductPanel}>
                  <header><div><span>ACTUAL STOREFRONT RENDERER</span><h2>Preview réelle</h2></div><b>Desktop</b></header>
                  <div className={styles.productPreviewFrame}><iframe title={`Storefront ${selected.title}`} src={publicHref(selected)}/></div>
                </section>
              </div>
              <aside className={styles.categoryProductPicker}>
                <header><span>CATALOGUE PICKER</span><h2>Ajouter des produits</h2></header>
                <label className={styles.assignmentSearch}><Search size={15}/><span className={styles.srOnly}>Rechercher un produit</span><input value={itemQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setItemQuery(event.target.value)} placeholder="Produit, SKU, référence…"/></label>
                <div className={styles.assignmentItems}>{visibleItems.slice(0, 160).map((item) => <label key={item.id} data-selected={assigned.includes(item.id)}><input type="checkbox" disabled={!canManage} checked={assigned.includes(item.id)} onChange={(event: ChangeEvent<HTMLInputElement>) => setAssigned((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}/><div><strong>{item.name_fr}</strong><span>{item.public_reference} · {item.status}</span></div></label>)}</div>
                <button type="button" className={styles.primaryAction} disabled={!canManage || mutation.saving} title={!canManage ? 'Permission marketplace.categories.manage requise' : undefined} onClick={() => void assignProducts()}>Synchroniser {assigned.length} produits</button>
                <p className={styles.categoryInfo}>La visibilité publique dépend du statut produit et de la relation catégorie ↔ catalogue.</p>
              </aside>
            </section>
          </> : null}

          {tab === 'preview' ? <>
            <CategoryTabs category={selected} active={tab} onPreview={() => setTab('preview')}/>
            <section className={styles.categoryPreviewOnly}>
              <header><div><span>ACTUAL STOREFRONT RENDERER</span><h2>{selected.title}</h2></div><a href={publicHref(selected)} target="_blank" rel="noreferrer">Ouvrir dans un nouvel onglet <ExternalLink size={14}/></a></header>
              <div className={styles.productPreviewFrame}><iframe title={`Preview ${selected.title}`} src={publicHref(selected)}/></div>
            </section>
          </> : null}
        </>}
  </main>
}
