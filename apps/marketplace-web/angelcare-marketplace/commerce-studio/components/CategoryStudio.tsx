'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Eye, FolderTree, GripVertical, Plus, Search, Tags, X } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CatalogAdminItem, CatalogCategoryAdmin, MediaAsset } from '../types'
import { apiRequest, Field, ImmediateAction, SelectField, StudioForm, StudioNotice, TextArea, useStudioMutation } from './StudioClient'

export function CategoryStudio({ initialCategories, items, media, category }: {
  initialCategories: CatalogCategoryAdmin[]
  items: CatalogAdminItem[]
  media: MediaAsset[]
  category?: CatalogCategoryAdmin | null
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [selected, setSelected] = useState<CatalogCategoryAdmin | null>(category || null)
  const [assigned, setAssigned] = useState<string[]>(
    () => Array.isArray(category?.items) ? category.items.map((entry) => String(entry.catalog_item_id)) : [],
  )
  const [categoryQuery, setCategoryQuery] = useState('')
  const [itemQuery, setItemQuery] = useState('')
  const [dragged, setDragged] = useState<string | null>(null)
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null)
  const mutation = useStudioMutation()

  const rootCategories = useMemo(
    () => categories
      .filter((entry) => entry.locale === 'fr')
      .sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  )

  const visibleCategories = useMemo(
    () => rootCategories.filter((entry) =>
      `${entry.title} ${entry.category_key} ${entry.slug}`.toLowerCase().includes(categoryQuery.toLowerCase()),
    ),
    [rootCategories, categoryQuery],
  )

  const assignedItems = assigned.map((id) => items.find((item) => item.id === id)).filter((item): item is CatalogAdminItem => Boolean(item))

  const visibleItems = useMemo(
    () => items.filter((item) =>
      `${item.name_fr} ${item.public_reference} ${item.sku || ''}`.toLowerCase().includes(itemQuery.toLowerCase()),
    ),
    [items, itemQuery],
  )

  async function assignProducts() {
    if (!selected) return
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
    if (!draggedProduct || draggedProduct === targetId) return
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
    if (!dragged || dragged === targetId) return
    const ordered = [...rootCategories]
    const from = ordered.findIndex((entry) => entry.id === dragged)
    const to = ordered.findIndex((entry) => entry.id === targetId)
    if (from < 0 || to < 0) return
    const [moved] = ordered.splice(from, 1)
    ordered.splice(to, 0, moved)
    const sortMap = new Map(ordered.map((entry, index) => [entry.id, index * 10]))
    setCategories((current) => current.map((entry) =>
      sortMap.has(entry.id) ? { ...entry, sort_order: sortMap.get(entry.id) || 0 } : entry,
    ))
    await mutation.run(
      () => apiRequest('/api/angelcare-marketplace/admin/catalog/categories/reorder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ordered_ids: ordered.map((entry) => entry.id) }),
      }),
      'Ordre des catégories publié immédiatement.',
    )
    setDragged(null)
  }

  function selectCategory(entry: CatalogCategoryAdmin) {
    setSelected(entry)
    setAssigned(Array.isArray(entry.items) ? entry.items.map((item) => String(item.catalog_item_id)) : [])
  }

  return <main className={styles.shell}>
    <section className={styles.workspaceHero} data-accent="category">
      <div><span>CATEGORY STUDIO</span><h1>Hiérarchie, identité visuelle et distribution produit.</h1><p>Créez des catégories trilingues, ordonnez-les, assignez les produits et voyez les storefronts se synchroniser.</p></div>
      <div className={styles.workspaceStats}><FolderTree size={27}/><strong>{rootCategories.length}</strong><span>catégories FR</span></div>
    </section>
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <section className={styles.categoryStudioLayout}>
      <aside className={styles.categoryTree}>
        <header><span>CATEGORY TREE</span><button type="button" onClick={() => { setSelected(null); setAssigned([]) }}><Plus size={15}/></button></header>
        <label className={styles.assignmentSearch}><Search size={15}/><input value={categoryQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setCategoryQuery(event.target.value)} placeholder="Rechercher une catégorie…"/></label>
        {visibleCategories.map((entry) => <button
          type="button"
          key={entry.id}
          draggable
          data-selected={selected?.id === entry.id}
          onClick={() => selectCategory(entry)}
          onDragStart={() => setDragged(entry.id)}
          onDragOver={(event: DragEvent<HTMLButtonElement>) => event.preventDefault()}
          onDrop={() => void reorder(entry.id)}
        ><GripVertical size={15}/><div><strong>{entry.title}</strong><span>{entry.item_count} produits · {entry.status}</span></div></button>)}
      </aside>

      <section className={styles.categoryEditor}>
        <span>{selected ? 'EDIT CATEGORY' : 'NEW CATEGORY'}</span>
        <h2>{selected?.title || 'Créer une catégorie'}</h2>
        <StudioForm resource="catalog-categories" id={selected?.id} onSaved={(record) => {
          const next = record as CatalogCategoryAdmin
          setSelected(next)
          setCategories((current) => selected ? current.map((entry) => entry.id === next.id ? next : entry) : [...current, next])
        }} submitLabel={selected ? 'Enregistrer' : 'Créer la catégorie'}>
          <div className={styles.formGrid}><SelectField name="locale" label="Locale" defaultValue={selected?.locale || 'fr'} options={['fr','en','ar']}/><SelectField name="status" label="Statut" defaultValue={selected?.status || 'published'} options={['draft','published','paused','archived']}/></div>
          <Field name="title" label="Titre" defaultValue={selected?.title} required/>
          <TextArea name="short_description" label="Introduction storefront" defaultValue={selected?.short_description}/>
          <div className={styles.formGrid}><Field name="category_key" label="Clé" defaultValue={selected?.category_key}/><Field name="slug" label="Slug" defaultValue={selected?.slug}/></div>
          <SelectField name="parent_category_id" label="Catégorie parente" defaultValue={selected?.parent_category_id} options={[{value:'',label:'Racine'},...rootCategories.filter((entry) => entry.id !== selected?.id).map((entry) => ({value:entry.id,label:entry.title}))]}/>
          <div className={styles.formGrid}><SelectField name="visual_theme" label="Thème" defaultValue={selected?.visual_theme || 'navy'} options={['navy','warm','blue','red','gold','health','corporate','saas','quality','professional']}/><SelectField name="storefront_template" label="Template" defaultValue={selected?.storefront_template || 'mixed'} options={['mixed','family-concierge','home-service-booking','developmental-discovery','product-commerce','academy-credential','institutional-transformation','hospitality-programme','health-adjacent','corporate-benefits','saas-commerce','quality-assessment','professional-marketplace']}/></div>
          <SelectField name="cover_asset_url" label="Cover desktop · Media Library" defaultValue={selected?.cover_asset_url} options={[{value:'',label:'Aucune couverture'},...media.filter((asset) => asset.media_type === 'image').map((asset) => ({value:asset.desktop_url,label:asset.file_name}))]}/>
          <SelectField name="mobile_cover_asset_url" label="Cover mobile · Media Library" defaultValue={selected?.mobile_cover_asset_url} options={[{value:'',label:'Dérivée automatiquement'},...media.filter((asset) => asset.media_type === 'image').map((asset) => ({value:asset.mobile_url || asset.desktop_url,label:asset.file_name}))]}/>
          <div className={styles.formGrid}><Field name="icon_key" label="Icône" defaultValue={selected?.icon_key}/><Field name="sort_order" label="Ordre" type="number" defaultValue={selected?.sort_order || 100}/></div>
          <Field name="seo_metadata_json" label="SEO JSON" defaultValue={JSON.stringify(selected?.seo_metadata || {})}/>
          <input type="hidden" name="visible" value="true"/>
        </StudioForm>
        {selected ? <div className={styles.actionBar}><ImmediateAction resource="catalog-categories" id={selected.id} action="publish" label="Publier maintenant"/><a href={`/angelcare-marketplace/fr/marketplace/category/${selected.slug}`} target="_blank"><Eye size={14}/> Voir storefront</a></div> : null}
      </section>

      <aside className={styles.categoryAssignment}>
        <span>PRODUCT ASSIGNMENT</span><h2>Produits dans la catégorie</h2>
        <div className={styles.selectedOrder}>{assignedItems.map((item, index) => <article key={item.id} draggable onDragStart={() => setDraggedProduct(item.id)} onDragOver={(event: DragEvent<HTMLElement>) => event.preventDefault()} onDrop={() => reorderAssigned(item.id)}><GripVertical size={14}/><strong>#{index + 1}</strong><span>{item.name_fr}</span><button type="button" onClick={() => setAssigned((current) => current.filter((id) => id !== item.id))}><X size={13}/></button></article>)}</div>
        <label className={styles.assignmentSearch}><Tags size={16}/><input value={itemQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setItemQuery(event.target.value)} placeholder="Rechercher un produit…"/></label>
        <div className={styles.assignmentItems}>{visibleItems.slice(0,160).map((item) => <label key={item.id} data-selected={assigned.includes(item.id)}><input type="checkbox" checked={assigned.includes(item.id)} onChange={(event: ChangeEvent<HTMLInputElement>) => setAssigned((current) => event.target.checked ? [...current,item.id] : current.filter((id) => id !== item.id))}/><div><strong>{item.name_fr}</strong><span>{item.public_reference} · {item.status}</span></div></label>)}</div>
        <button type="button" className={styles.primaryAction} disabled={!selected || mutation.saving} onClick={() => void assignProducts()}><Tags size={16}/> Assigner {assigned.length} produits</button>
        <small>Les assignations utilisent la relation canonique catalogue/catégorie et deviennent visibles sans déploiement.</small>
      </aside>
    </section>
  </main>
}
