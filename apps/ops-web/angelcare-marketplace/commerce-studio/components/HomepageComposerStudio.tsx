'use client'

import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { Eye, GripVertical, LayoutGrid, Monitor, Plus, Send, Smartphone, Tablet, Trash2 } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CommerceRecord, HomepageSectionRecord } from '../types'
import { apiRequest, CheckField, Field, ImmediateAction, SelectField, StudioForm, StudioNotice, TextArea, useStudioMutation } from './StudioClient'

const templates = [
  'audience_gateway','category_mosaic','featured_products','popular_now','best_picks','available_now','new_arrivals',
  'family_services','home_services','development_montessori','kits_products','academy','b2b_verticals','partner_os',
  'quality_check','trust_evidence','custom_editorial','custom_banner','custom_product_grid','custom_collection_carousel',
]

export function HomepageComposerStudio({ initialSections, collections, mode = 'composer' }: { initialSections: HomepageSectionRecord[]; collections: CommerceRecord[]; mode?: string }) {
  const [sections, setSections] = useState(initialSections)
  const [selectedId, setSelectedId] = useState(initialSections[0]?.id || '')
  const [preview, setPreview] = useState<'desktop'|'tablet'|'mobile'>('desktop')
  const [dragged, setDragged] = useState<string | null>(null)
  const mutation = useStudioMutation()
  const selected = useMemo(()=>sections.find((section)=>section.id===selectedId)||null,[sections,selectedId])

  async function reorder(targetId: string) {
    if (!dragged || dragged === targetId) return
    const current = [...sections]
    const from = current.findIndex((section)=>section.id===dragged)
    const to = current.findIndex((section)=>section.id===targetId)
    if (from < 0 || to < 0) return
    const [moved] = current.splice(from,1); current.splice(to,0,moved)
    setSections(current); setDragged(null)
    await mutation.run(()=>apiRequest('/api/angelcare-marketplace/admin/commerce/homepage-sections/bulk/reorder',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ordered_ids:current.map((section)=>section.id)})}),'Nouvel ordre appliqué à la homepage.')
  }

  return <main className={styles.shell}>
    <section className={styles.workspaceHero} data-accent="homepage"><div><span>HOMEPAGE COMPOSER · {mode.toUpperCase()}</span><h1>La homepage devient une composition vivante.</h1><p>Ajoutez, masquez, dupliquez, réordonnez et publiez chaque section. Aucun déploiement requis.</p></div><div className={styles.deviceSwitch}><button data-active={preview==='desktop'} onClick={()=>setPreview('desktop')}><Monitor size={17}/></button><button data-active={preview==='tablet'} onClick={()=>setPreview('tablet')}><Tablet size={17}/></button><button data-active={preview==='mobile'} onClick={()=>setPreview('mobile')}><Smartphone size={17}/></button></div></section>
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <section className={styles.composerLayout}>
      <aside className={styles.sectionStack}><header><div><span>LIVE COMPOSITION</span><h2>Sections</h2></div><button type="button" onClick={()=>setSelectedId('new')}><Plus size={16}/> Ajouter</button></header><div>{sections.map((section,index)=><button type="button" draggable key={section.id} data-selected={selectedId===section.id} data-visible={section.visible&&section.status==='active'} onDragStart={()=>setDragged(section.id)} onDragOver={(event:DragEvent<HTMLButtonElement>)=>event.preventDefault()} onDrop={()=>void reorder(section.id)} onClick={()=>setSelectedId(section.id)}><GripVertical size={17}/><span><strong>{section.title}</strong><small>{section.section_type} · ordre {index+1}</small></span><i>{section.visible?'LIVE':'HIDDEN'}</i></button>)}</div></aside>
      <section className={styles.previewStage} data-device={preview}><div className={styles.previewBrowser}><header><i/><i/><i/><span>angelcare-marketplace/fr</span></header><div className={styles.previewCanvas}>{sections.filter((section)=>section.visible&&section.status==='active').map((section)=><article key={section.id} data-type={section.section_type} data-accent={section.accent}><span>{section.section_type.replaceAll('_',' ')}</span><h3>{section.title}</h3><p>{section.subtitle || 'Section commerciale connectée à sa source canonique.'}</p><div>{Array.from({length:Math.min(Number(section.settings.item_limit||4),6)},(_,index)=><i key={index}/>)}</div></article>)}</div></div><a className={styles.livePreviewLink} href="/angelcare-marketplace/fr" target="_blank"><Eye size={16}/> Ouvrir la homepage live</a></section>
      <aside className={styles.sectionInspector}>{selectedId==='new'?<><span>NEW SECTION</span><h2>Ajouter une section</h2><StudioForm resource="homepage-sections" onSaved={(record)=>{setSections((current)=>[...current,record as HomepageSectionRecord]);setSelectedId(record.id)}} submitLabel="Créer et activer"><Field name="title" label="Titre FR" required/><TextArea name="subtitle" label="Introduction"/><SelectField name="section_type" label="Template" options={templates}/><SelectField name="locale" label="Locale" options={['fr','en','ar']}/><div className={styles.formGrid}><Field name="sort_order" label="Ordre" type="number" defaultValue={sections.length*10}/><Field name="settings_json" label="Configuration JSON" defaultValue='{"item_limit":8}'/></div><CheckField name="visible" label="Visible immédiatement" defaultChecked/><input type="hidden" name="status" value="active"/></StudioForm></>:selected?<><span>SECTION INSPECTOR</span><h2>{selected.title}</h2><StudioForm resource="homepage-sections" id={selected.id} onSaved={(record)=>setSections((current)=>current.map((item)=>item.id===record.id?record as HomepageSectionRecord:item))}><Field name="title" label="Titre" defaultValue={selected.title} required/><TextArea name="subtitle" label="Sous-titre" defaultValue={selected.subtitle}/><SelectField name="section_type" label="Template" defaultValue={selected.section_type} options={templates}/><SelectField name="layout_variant" label="Layout" defaultValue={selected.layout_variant} options={['rail','grid','mosaic','split','full-width','editorial']}/><div className={styles.formGrid}><Field name="sort_order" label="Ordre" type="number" defaultValue={selected.sort_order}/><SelectField name="accent" label="Accent" defaultValue={selected.accent} options={['navy','red','blue','gold','green','warm','health','corporate']}/></div><SelectField name="background_variant" label="Fond" defaultValue={selected.background_variant} options={['white','soft','navy','warm','image']}/><Field name="settings_json" label="Configuration JSON" defaultValue={JSON.stringify(selected.settings)}/><SelectField name="collection_id" label="Collection source" defaultValue={String(selected.settings.collection_id||'')} options={[{value:'',label:'Sélection automatique'},...collections.map((collection)=>({value:String(collection.id),label:String(collection.title||collection.collection_key)}))]}/><CheckField name="visible" label="Visible" defaultChecked={selected.visible}/><input type="hidden" name="status" value={selected.status}/></StudioForm><div className={styles.actionBar}><ImmediateAction resource="homepage-sections" id={selected.id} action={selected.status==='active'?'unpublish':'publish'} label={selected.status==='active'?'Masquer maintenant':'Publier maintenant'} onDone={()=>setSections((current)=>current.map((item)=>item.id===selected.id?{...item,status:item.status==='active'?'paused':'active'}:item))}/><ImmediateAction resource="homepage-sections" id={selected.id} action="duplicate" label="Dupliquer"/><ImmediateAction resource="homepage-sections" id={selected.id} action="archive" label="Archiver" tone="danger" onDone={()=>setSections((current)=>current.filter((item)=>item.id!==selected.id))}/></div></>:null}</aside>
    </section>
  </main>
}
