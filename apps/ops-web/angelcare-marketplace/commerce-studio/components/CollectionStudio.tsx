'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { GalleryHorizontal, GripVertical, Plus, Tags, X } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CatalogAdminItem, CommerceRecord, MediaAsset } from '../types'
import { apiRequest, Field, ImmediateAction, SelectField, StudioForm, StudioNotice, TextArea, useStudioMutation } from './StudioClient'

export function CollectionStudio({ initialCollections, items, media }: { initialCollections: CommerceRecord[]; items: CatalogAdminItem[]; media: MediaAsset[] }) {
  const [collections, setCollections] = useState(initialCollections)
  const [selectedId, setSelectedId] = useState(initialCollections[0]?.id || 'new')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [dragged, setDragged] = useState<string | null>(null)
  const mutation = useStudioMutation()
  const selected = useMemo(() => collections.find((collection) => collection.id === selectedId) || null, [collections, selectedId])

  useEffect(() => {
    setSelectedItems(Array.isArray(selected?.items) ? selected.items.map((entry) => String(entry.catalog_item_id)) : [])
  }, [selectedId, selected])

  const filtered = items.filter((item) => `${item.name_fr} ${item.public_reference} ${item.sku || ''}`.toLowerCase().includes(query.toLowerCase()))
  const orderedItems = selectedItems.map((id) => items.find((item) => item.id === id)).filter((item): item is CatalogAdminItem => Boolean(item))

  async function assign() {
    if (!selected) return
    await mutation.run(
      () => apiRequest(`/api/angelcare-marketplace/admin/commerce/homepage-collections/${selected.id}/assign-items`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item_ids: selectedItems }),
      }),
      'Collection synchronisée avec la homepage et le catalogue.',
    )
  }

  function reorder(targetId: string) {
    if (!dragged || dragged === targetId) return
    setSelectedItems((current) => {
      const next = [...current]
      const from = next.indexOf(dragged)
      const to = next.indexOf(targetId)
      if (from < 0 || to < 0) return current
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDragged(null)
  }

  return <main className={styles.shell}>
    <section className={styles.workspaceHero} data-accent="merchandising"><div><span>COLLECTION STUDIO</span><h1>Collections éditoriales, produits ordonnés et publication immédiate.</h1><p>Composez des rails commerciaux avec des objets canoniques, ciblage, limite, calendrier et couverture Media Library.</p></div><div className={styles.workspaceStats}><GalleryHorizontal size={27}/><strong>{collections.length}</strong><span>collections</span></div></section>
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <section className={styles.collectionStudioLayout}>
      <aside className={styles.collectionRegistry}><header><span>COLLECTIONS</span><button type="button" onClick={() => setSelectedId('new')}><Plus size={15}/></button></header>{collections.map((collection) => <button type="button" key={collection.id} data-selected={collection.id === selectedId} onClick={() => setSelectedId(collection.id)}><strong>{String(collection.title)}</strong><span>{String(collection.locale)} · {String(collection.status)}</span></button>)}</aside>
      <section className={styles.collectionEditor}><span>{selected ? 'EDIT COLLECTION' : 'NEW COLLECTION'}</span><h2>{String(selected?.title || 'Créer une collection')}</h2><StudioForm resource="homepage-collections" id={selected?.id} onSaved={(record) => { setCollections((current) => selected ? current.map((item) => item.id === record.id ? record : item) : [record,...current]); setSelectedId(record.id) }} submitLabel={selected ? 'Enregistrer' : 'Créer la collection'}><Field name="title" label="Titre FR" defaultValue={String(selected?.title || '')} required/><TextArea name="subtitle" label="Sous-titre" defaultValue={String(selected?.subtitle || '')}/><TextArea name="description" label="Introduction" defaultValue={String(selected?.description || '')}/><div className={styles.formGrid}><Field name="collection_key" label="Clé" defaultValue={String(selected?.collection_key || '')}/><SelectField name="locale" label="Locale" defaultValue={String(selected?.locale || 'fr')} options={['fr','en','ar']}/></div><div className={styles.formGrid}><SelectField name="selection_method" label="Mode" defaultValue={String(selected?.selection_method || 'editorial')} options={['editorial','rules','hybrid']}/><SelectField name="layout_variant" label="Template" defaultValue={String(selected?.layout_variant || 'service_cards')} options={['service_cards','product_cards','academy_cards','b2b_cards','mixed_cards','logos','editorial']}/></div><SelectField name="cover_media_asset_id" label="Cover Media Library" defaultValue={String(selected?.cover_media_asset_id || '')} options={[{value:'',label:'Aucune couverture'},...media.filter((asset) => asset.media_type === 'image').map((asset) => ({value:asset.id,label:asset.file_name}))]}/><div className={styles.formGrid}><Field name="item_limit" label="Limite" type="number" defaultValue={Number(selected?.item_limit || 12)}/><Field name="sort_order" label="Ordre" type="number" defaultValue={Number(selected?.sort_order || 100)}/></div><div className={styles.formGrid}><SelectField name="audience" label="Audience" defaultValue={String(selected?.audience || 'all')} options={['all','family','organization','professional']}/><SelectField name="status" label="Statut" defaultValue={String(selected?.status || 'active')} options={['draft','scheduled','active','paused','archived']}/></div><div className={styles.formGrid}><Field name="starts_at" label="Début" type="datetime-local" defaultValue={String(selected?.starts_at || '')}/><Field name="ends_at" label="Fin" type="datetime-local" defaultValue={String(selected?.ends_at || '')}/></div></StudioForm>{selected ? <div className={styles.actionBar}><ImmediateAction resource="homepage-collections" id={selected.id} action={selected.status === 'active' ? 'unpublish' : 'publish'} label={selected.status === 'active' ? 'Dépublier' : 'Publier maintenant'}/><ImmediateAction resource="homepage-collections" id={selected.id} action="duplicate" label="Dupliquer"/></div> : null}</section>
      <aside className={styles.collectionAssignment}><span>COLLECTION ITEMS</span><h2>Choisir et ordonner les produits</h2><div className={styles.selectedOrder}>{orderedItems.map((item, index) => <article key={item.id} draggable onDragStart={() => setDragged(item.id)} onDragOver={(event: DragEvent<HTMLElement>) => event.preventDefault()} onDrop={() => reorder(item.id)}><GripVertical size={14}/><strong>#{index + 1}</strong><span>{item.name_fr}</span><button type="button" onClick={() => setSelectedItems((current) => current.filter((id) => id !== item.id))}><X size={13}/></button></article>)}</div><label className={styles.assignmentSearch}><Tags size={16}/><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Rechercher produit, SKU, référence…"/></label><div className={styles.assignmentItems}>{filtered.slice(0,160).map((item) => <label key={item.id} data-selected={selectedItems.includes(item.id)}><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={(event: ChangeEvent<HTMLInputElement>) => setSelectedItems((current) => event.target.checked ? [...current,item.id] : current.filter((id) => id !== item.id))}/><div><strong>{item.name_fr}</strong><span>{item.public_reference} · {item.status}</span></div></label>)}</div><button type="button" className={styles.primaryAction} disabled={!selected || mutation.saving} onClick={() => void assign()}><Tags size={16}/> Synchroniser {selectedItems.length} produits</button></aside>
    </section>
  </main>
}
