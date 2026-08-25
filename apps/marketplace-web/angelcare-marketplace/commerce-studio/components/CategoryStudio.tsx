'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Eye, FolderTree, GripVertical, LayoutTemplate, Plus, Search, SlidersHorizontal, Tags, X } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CatalogAdminItem, CatalogCategoryAdmin, MediaAsset } from '../types'
import { apiRequest, Field, ImmediateAction, SelectField, StudioForm, StudioNotice, TextArea, useStudioMutation } from './StudioClient'

type CategoryTab='identity'|'storefront'|'filters'|'products'|'preview'
const obj=(value:unknown)=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const str=(value:unknown)=>typeof value==='string'?value:''
const csv=(value:unknown)=>Array.isArray(value)?value.map(String).join(', '):str(value)

function CategoryExperienceEditor({category,onSaved}:{category:CatalogCategoryAdmin;onSaved:(record:CatalogCategoryAdmin)=>void}){
  const hero=obj(category.hero_content)
  const experience=obj(category.experience_config)
  const filters=obj(category.filter_config)
  const [values,setValues]=useState<Record<string,unknown>>({
    hero_eyebrow:str(hero.eyebrow),hero_title:str(hero.title)||category.title,hero_lead:str(hero.lead)||category.short_description||'',hero_cta_label:str(hero.cta_label)||'Explorer',hero_cta_href:str(hero.cta_href),
    search_placeholder:str(experience.search_placeholder)||'Que recherchez-vous ?',featured_title:str(experience.featured_title)||'Sélection mise en avant',inventory_title:str(experience.inventory_title)||'Tout découvrir',editorial_title:str(experience.editorial_title),editorial_body:str(experience.editorial_body),closing_title:str(experience.closing_title),closing_lead:str(experience.closing_lead),closing_cta_label:str(experience.closing_cta_label),closing_cta_href:str(experience.closing_cta_href),
    filter_keys:csv(filters.filter_keys),sort_options:csv(filters.sort_options)||'recommended, newest, price_asc, price_desc',show_featured:filters.show_featured!==false,show_collections:filters.show_collections!==false,seo_title:str(category.seo_metadata?.title_fr),seo_description:str(category.seo_metadata?.description_fr),
  })
  const mutation=useStudioMutation()
  async function save(){
    const hero_content={eyebrow:values.hero_eyebrow,title:values.hero_title,lead:values.hero_lead,cta_label:values.hero_cta_label,cta_href:values.hero_cta_href}
    const experience_config={search_placeholder:values.search_placeholder,featured_title:values.featured_title,inventory_title:values.inventory_title,editorial_title:values.editorial_title,editorial_body:values.editorial_body,closing_title:values.closing_title,closing_lead:values.closing_lead,closing_cta_label:values.closing_cta_label,closing_cta_href:values.closing_cta_href}
    const filter_config={filter_keys:String(values.filter_keys||'').split(',').map(v=>v.trim()).filter(Boolean),sort_options:String(values.sort_options||'').split(',').map(v=>v.trim()).filter(Boolean),show_featured:Boolean(values.show_featured),show_collections:Boolean(values.show_collections)}
    const seo_metadata={...obj(category.seo_metadata),title_fr:values.seo_title,description_fr:values.seo_description}
    const storefront_sections=[
      {key:'editorial',type:'editorial',title:values.editorial_title,body:values.editorial_body,visible:Boolean(values.editorial_title||values.editorial_body)},
      {key:'closing',type:'cta',title:values.closing_title,body:values.closing_lead,cta_label:values.closing_cta_label,cta_href:values.closing_cta_href,visible:Boolean(values.closing_title||values.closing_lead)},
    ]
    const result=await mutation.run(()=>apiRequest<{record:CatalogAdminItem}>(`/api/angelcare-marketplace/admin/commerce/catalog-categories/${category.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({hero_content,experience_config,filter_config,storefront_sections,seo_metadata})}),'Storefront configuré et prêt à être consommé par le frontend.')
    if(result)onSaved(result.record as unknown as CatalogCategoryAdmin)
  }
  function field(key:string,label:string,textarea=false){return <label className={styles.field}><span>{label}</span>{textarea?<textarea rows={4} value={String(values[key]??'')} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/>:<input value={String(values[key]??'')} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/>}</label>}
  return <div className={styles.categoryExperiencePanel}>
    <header><div><span>STOREFRONT EXPERIENCE</span><h2>Composer ce que le client voit</h2><p>Le hero, les textes de décision, les filtres et les sections de fermeture deviennent des données administrables, sans modification TypeScript.</p></div><LayoutTemplate size={26}/></header>
    <div className={styles.formGrid}>{field('hero_eyebrow','Eyebrow')}{field('hero_title','Titre hero')}</div>
    {field('hero_lead','Introduction hero',true)}
    <div className={styles.formGrid}>{field('hero_cta_label','CTA hero')}{field('hero_cta_href','Destination CTA')}</div>
    <div className={styles.formGrid}>{field('search_placeholder','Placeholder recherche')}{field('featured_title','Titre sélection')}</div>
    {field('inventory_title','Titre inventaire')}
    {field('editorial_title','Titre éditorial')}{field('editorial_body','Bloc éditorial',true)}
    <div className={styles.formGrid}>{field('closing_title','Titre de fermeture')}{field('closing_cta_label','CTA final')}</div>
    {field('closing_lead','Texte de fermeture',true)}{field('closing_cta_href','Destination finale')}
    <div className={styles.formGrid}>{field('filter_keys','Filtres exposés (séparés par virgule)')}{field('sort_options','Tris exposés')}</div><div className={styles.formGrid}>{field('seo_title','SEO title')}{field('seo_description','SEO description')}</div>
    <div className={styles.inlineChecks}><label><input type="checkbox" checked={Boolean(values.show_featured)} onChange={e=>setValues(v=>({...v,show_featured:e.target.checked}))}/> Sélection featured</label><label><input type="checkbox" checked={Boolean(values.show_collections)} onChange={e=>setValues(v=>({...v,show_collections:e.target.checked}))}/> Collections</label></div>
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <button className={styles.primaryAction} type="button" disabled={mutation.saving} onClick={()=>void save()}><LayoutTemplate size={16}/> Enregistrer l’expérience storefront</button>
  </div>
}

export function CategoryStudio({ initialCategories, items, media, category }: {
  initialCategories: CatalogCategoryAdmin[]
  items: CatalogAdminItem[]
  media: MediaAsset[]
  category?: CatalogCategoryAdmin | null
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [selected, setSelected] = useState<CatalogCategoryAdmin | null>(category || null)
  const [assigned, setAssigned] = useState<string[]>(() => Array.isArray(category?.items) ? category.items.map((entry) => String(entry.catalog_item_id)) : [])
  const [categoryQuery, setCategoryQuery] = useState('')
  const [itemQuery, setItemQuery] = useState('')
  const [dragged, setDragged] = useState<string | null>(null)
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null)
  const [tab,setTab]=useState<CategoryTab>('identity')
  const mutation = useStudioMutation()

  const rootCategories = useMemo(() => categories.filter((entry) => entry.locale === 'fr').sort((a, b) => a.sort_order - b.sort_order), [categories])
  const visibleCategories = useMemo(() => rootCategories.filter((entry) => `${entry.title} ${entry.category_key} ${entry.slug}`.toLowerCase().includes(categoryQuery.toLowerCase())), [rootCategories, categoryQuery])
  const assignedItems = assigned.map((id) => items.find((item) => item.id === id)).filter((item): item is CatalogAdminItem => Boolean(item))
  const visibleItems = useMemo(() => items.filter((item) => `${item.name_fr} ${item.public_reference} ${item.sku || ''}`.toLowerCase().includes(itemQuery.toLowerCase())), [items, itemQuery])

  async function assignProducts() { if (!selected) return; await mutation.run(() => apiRequest(`/api/angelcare-marketplace/admin/commerce/catalog-categories/${selected.id}/assign-products`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ item_ids: assigned }) }), 'Produits assignés et storefront rafraîchi.') }
  function reorderAssigned(targetId: string) { if (!draggedProduct || draggedProduct === targetId) return; setAssigned((current) => { const next = [...current]; const from = next.indexOf(draggedProduct); const to = next.indexOf(targetId); if (from < 0 || to < 0) return current; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next }); setDraggedProduct(null) }
  async function reorder(targetId: string) { if (!dragged || dragged === targetId) return; const ordered = [...rootCategories]; const from = ordered.findIndex((entry) => entry.id === dragged); const to = ordered.findIndex((entry) => entry.id === targetId); if (from < 0 || to < 0) return; const [moved] = ordered.splice(from, 1); ordered.splice(to, 0, moved); const sortMap = new Map(ordered.map((entry, index) => [entry.id, index * 10])); setCategories((current) => current.map((entry) => sortMap.has(entry.id) ? { ...entry, sort_order: sortMap.get(entry.id) || 0 } : entry)); await mutation.run(() => apiRequest('/api/angelcare-marketplace/admin/catalog/categories/reorder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ordered_ids: ordered.map((entry) => entry.id) }) }), 'Ordre des catégories publié immédiatement.'); setDragged(null) }
  function selectCategory(entry: CatalogCategoryAdmin) { setSelected(entry); setAssigned(Array.isArray(entry.items) ? entry.items.map((item) => String(item.catalog_item_id)) : []); setTab('identity') }
  function mergeSaved(next:CatalogCategoryAdmin){setSelected(next);setCategories(current=>current.some(e=>e.id===next.id)?current.map(e=>e.id===next.id?next:e):[...current,next])}

  return <main className={styles.shell}>
    <section className={styles.workspaceHero} data-accent="category"><div><span>CATEGORY STOREFRONT STUDIO 2.0</span><h1>Hiérarchie, commerce et expérience client dans le même studio.</h1><p>La catégorie n’est plus une simple taxonomie : Admin contrôle le hero, la découverte, les produits, les filtres et les sections publiques qui composent son storefront.</p></div><div className={styles.workspaceStats}><FolderTree size={27}/><strong>{rootCategories.length}</strong><span>catégories FR</span></div></section>
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <section className={styles.categoryStudioLayout}>
      <aside className={styles.categoryTree}><header><span>CATEGORY TREE</span><button type="button" onClick={() => { setSelected(null); setAssigned([]);setTab('identity') }}><Plus size={15}/></button></header><label className={styles.assignmentSearch}><Search size={15}/><input value={categoryQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setCategoryQuery(event.target.value)} placeholder="Rechercher une catégorie…"/></label>{visibleCategories.map((entry) => <button type="button" key={entry.id} draggable data-selected={selected?.id === entry.id} onClick={() => selectCategory(entry)} onDragStart={() => setDragged(entry.id)} onDragOver={(event: DragEvent<HTMLButtonElement>) => event.preventDefault()} onDrop={() => void reorder(entry.id)}><GripVertical size={15}/><div><strong>{entry.title}</strong><span>{entry.item_count} produits · {entry.status}</span></div></button>)}</aside>

      <section className={styles.categoryEditor}>
        <nav className={styles.categoryTabs}>{(['identity','storefront','filters','products','preview'] as CategoryTab[]).map(key=><button type="button" key={key} data-active={tab===key} disabled={!selected&&key!=='identity'} onClick={()=>setTab(key)}>{key==='identity'?'Identité':key==='storefront'?'Storefront':key==='filters'?'Discovery':key==='products'?'Produits':'Preview'}</button>)}</nav>
        {tab==='identity'?<><span>{selected ? 'EDIT CATEGORY' : 'NEW CATEGORY'}</span><h2>{selected?.title || 'Créer une catégorie'}</h2><StudioForm resource="catalog-categories" id={selected?.id} onSaved={(record) => mergeSaved(record as CatalogCategoryAdmin)} submitLabel={selected ? 'Enregistrer' : 'Créer la catégorie'}><div className={styles.formGrid}><SelectField name="locale" label="Locale" defaultValue={selected?.locale || 'fr'} options={['fr','en','ar']}/><SelectField name="status" label="Statut" defaultValue={selected?.status || 'published'} options={['draft','published','paused','archived']}/></div><Field name="title" label="Titre" defaultValue={selected?.title} required/><TextArea name="short_description" label="Introduction storefront" defaultValue={selected?.short_description}/><div className={styles.formGrid}><Field name="category_key" label="Clé" defaultValue={selected?.category_key}/><Field name="slug" label="Slug" defaultValue={selected?.slug}/></div><SelectField name="parent_category_id" label="Catégorie parente" defaultValue={selected?.parent_category_id} options={[{value:'',label:'Racine'},...rootCategories.filter((entry) => entry.id !== selected?.id).map((entry) => ({value:entry.id,label:entry.title}))]}/><div className={styles.formGrid}><SelectField name="visual_theme" label="Thème" defaultValue={selected?.visual_theme || 'navy'} options={['navy','warm','blue','red','gold','health','corporate','saas','quality','professional']}/><SelectField name="storefront_template" label="Template" defaultValue={selected?.storefront_template || 'mixed'} options={['mixed','family-concierge','home-service-booking','developmental-discovery','product-commerce','academy-credential','institutional-transformation','hospitality-programme','health-adjacent','corporate-benefits','saas-commerce','quality-assessment','professional-marketplace']}/></div><SelectField name="cover_asset_url" label="Cover desktop · Media Library" defaultValue={selected?.cover_asset_url} options={[{value:'',label:'Aucune couverture'},...media.filter((asset) => asset.media_type === 'image').map((asset) => ({value:asset.desktop_url,label:asset.file_name}))]}/><SelectField name="mobile_cover_asset_url" label="Cover mobile · Media Library" defaultValue={selected?.mobile_cover_asset_url} options={[{value:'',label:'Dérivée automatiquement'},...media.filter((asset) => asset.media_type === 'image').map((asset) => ({value:asset.mobile_url || asset.desktop_url,label:asset.file_name}))]}/><div className={styles.formGrid}><Field name="icon_key" label="Icône" defaultValue={selected?.icon_key}/><Field name="sort_order" label="Ordre" type="number" defaultValue={selected?.sort_order || 100}/></div><input type="hidden" name="visible" value="true"/></StudioForm>{selected ? <div className={styles.actionBar}><ImmediateAction resource="catalog-categories" id={selected.id} action="publish" label="Publier maintenant"/><a href={`/angelcare-marketplace/fr/marketplace/category/${selected.category_key||selected.slug}`} target="_blank"><Eye size={14}/> Voir storefront</a></div> : null}</>:null}
        {tab==='storefront'&&selected?<CategoryExperienceEditor key={`${selected.id}-${selected.updated_at||''}`} category={selected} onSaved={mergeSaved}/>:null}
        {tab==='filters'&&selected?<div className={styles.categoryExperiencePanel}><header><div><span>DISCOVERY CONTROL</span><h2>Filtres, tris et merchandising natif</h2><p>Le panneau Storefront configure directement les filtres exposés. Les attributs produit continuent d’alimenter les facettes réelles.</p></div><SlidersHorizontal size={26}/></header><CategoryExperienceEditor category={selected} onSaved={mergeSaved}/></div>:null}
        {tab==='products'&&selected?<div className={styles.categoryExperiencePanel}><span>PRODUCT DISTRIBUTION</span><h2>Composition commerciale de la catégorie</h2><p>Utilisez le panneau droit pour sélectionner, ordonner puis synchroniser les produits avec la relation canonique du catalogue.</p></div>:null}
        {tab==='preview'&&selected?<div className={styles.categoryExperiencePanel}><span>ACTUAL STOREFRONT RENDERER</span><h2>Preview réelle</h2><div className={styles.productPreviewFrame}><iframe title={`Storefront ${selected.title}`} src={`/angelcare-marketplace/fr/marketplace/category/${selected.category_key||selected.slug}`}/></div></div>:null}
      </section>

      <aside className={styles.categoryAssignment}><span>PRODUCT ASSIGNMENT</span><h2>Produits dans la catégorie</h2><div className={styles.selectedOrder}>{assignedItems.map((item, index) => <article key={item.id} draggable onDragStart={() => setDraggedProduct(item.id)} onDragOver={(event: DragEvent<HTMLElement>) => event.preventDefault()} onDrop={() => reorderAssigned(item.id)}><GripVertical size={14}/><strong>#{index + 1}</strong><span>{item.name_fr}</span><button type="button" onClick={() => setAssigned((current) => current.filter((id) => id !== item.id))}><X size={13}/></button></article>)}</div><label className={styles.assignmentSearch}><Tags size={16}/><input value={itemQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setItemQuery(event.target.value)} placeholder="Rechercher un produit…"/></label><div className={styles.assignmentItems}>{visibleItems.slice(0,160).map((item) => <label key={item.id} data-selected={assigned.includes(item.id)}><input type="checkbox" checked={assigned.includes(item.id)} onChange={(event: ChangeEvent<HTMLInputElement>) => setAssigned((current) => event.target.checked ? [...current,item.id] : current.filter((id) => id !== item.id))}/><div><strong>{item.name_fr}</strong><span>{item.public_reference} · {item.status}</span></div></label>)}</div><button type="button" className={styles.primaryAction} disabled={!selected || mutation.saving} onClick={() => void assignProducts()}><Tags size={16}/> Synchroniser {assigned.length} produits</button><small>Les produits publiés deviennent visibles automatiquement dans le storefront selon cette relation canonique.</small></aside>
    </section>
  </main>
}
