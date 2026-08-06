'use client'

import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { Check, ChevronRight, Eye, FileSpreadsheet, GripVertical, Layers3, Pause, Play, Save, Search, SlidersHorizontal } from 'lucide-react'
import styles from '../category-native.module.css'
import type { CategoryNativeStudioData, ExperienceSchemaFieldRecord, ExperienceSchemaRecord } from '../types'
import { categoryNativeRequest, useCategoryNativeMutation } from './CategoryNativeClient'

export function SchemaArchitectureStudio({ initialData }: { initialData: CategoryNativeStudioData }) {
  const [schemas,setSchemas] = useState(initialData.schemas)
  const [selectedKey,setSelectedKey] = useState(initialData.schemas[0]?.schema_key || '')
  const [query,setQuery] = useState('')
  const [dragged,setDragged] = useState<string | null>(null)
  const mutation = useCategoryNativeMutation()
  const filtered = useMemo(()=>schemas.filter((schema)=>`${schema.name_fr} ${schema.schema_key} ${schema.segment_key} ${schema.vertical_key}`.toLowerCase().includes(query.toLowerCase())),[schemas,query])
  const selected = schemas.find((schema)=>schema.schema_key===selectedKey) || null

  async function patchSchema(payload: Record<string,unknown>) {
    if (!selected) return
    const result = await mutation.run(()=>categoryNativeRequest<{record:ExperienceSchemaRecord}>(`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),'Schéma enregistré et versionné.')
    if (result) setSchemas((current)=>current.map((item)=>item.schema_key===result.record.schema_key?result.record:item))
  }
  async function patchField(field: ExperienceSchemaFieldRecord, payload: Record<string,unknown>) {
    if (!selected) return
    const result = await mutation.run(()=>categoryNativeRequest<{record:ExperienceSchemaFieldRecord}>(`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}/fields/${field.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),'Champ synchronisé sur Admin, CSV, public et opérations.')
    if (result) setSchemas((current)=>current.map((schema)=>schema.schema_key===selected.schema_key?{...schema,fields:schema.fields.map((entry)=>entry.id===field.id?result.record:entry)}:schema))
  }
  async function reorder(targetId: string) {
    if (!selected || !dragged || dragged===targetId) return
    const fields=[...selected.fields]; const from=fields.findIndex((field)=>field.id===dragged); const to=fields.findIndex((field)=>field.id===targetId)
    if(from<0||to<0)return; const [moved]=fields.splice(from,1); fields.splice(to,0,moved); setDragged(null)
    setSchemas((current)=>current.map((schema)=>schema.schema_key===selected.schema_key?{...schema,fields}:schema))
    await mutation.run(()=>categoryNativeRequest(`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}/fields/reorder`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ordered_ids:fields.map((field)=>field.id)})}),'Ordre de studio appliqué.')
  }

  return <main className={styles.shell}>
    <section className={styles.workspaceHero}><div><span>EXPERIENCE SCHEMA ARCHITECTURE</span><h1>Le contrat vivant entre le Backoffice, le CSV et chaque expérience commerciale.</h1><p>Activez les champs, contrôlez leur visibilité et leur rôle sans dupliquer la logique dans plusieurs modules.</p></div><div className={styles.heroActions}><a href="/angelcare-marketplace/admin/category-native/template-factory"><FileSpreadsheet/> Template Factory</a><a href="/angelcare-marketplace/admin/category-native/archetypes"><Layers3/> Studios</a></div></section>
    {(mutation.message||mutation.error)&&<div className={styles.notice} data-error={Boolean(mutation.error)}>{mutation.error||mutation.message}<button onClick={mutation.clear}>×</button></div>}
    <section className={styles.architectureLayout}>
      <aside className={styles.schemaRail}><label><Search size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Schéma, segment, verticale…"/></label><div>{filtered.map((schema)=><button key={schema.schema_key} data-selected={selectedKey===schema.schema_key} onClick={()=>setSelectedKey(schema.schema_key)}><span>{schema.segment_key}</span><strong>{schema.name_fr}</strong><small>{schema.vertical_key} · v{schema.version}</small><i data-active={schema.status==='active'}>{schema.status}</i><ChevronRight size={16}/></button>)}</div></aside>
      {selected?<>
        <section className={styles.schemaCanvas}>
          <header><div><span>{selected.segment_key} / {selected.vertical_key} / {selected.category_key}</span><h2>{selected.name_fr}</h2><p>{selected.description_fr}</p></div><div><b>{selected.fields.length}</b><span>champs</span></div></header>
          <div className={styles.flowMap}><article><span>ADMIN</span><strong>{selected.admin_studio_template}</strong></article><ChevronRight/><article><span>CSV</span><strong>{selected.schema_key}.csv</strong></article><ChevronRight/><article><span>PUBLIC</span><strong>{selected.public_experience_template}</strong></article><ChevronRight/><article><span>HANDOVER</span><strong>{selected.operations_handover_type}</strong></article></div>
          <div className={styles.fieldMatrixHeader}><span>FIELD ARCHITECTURE</span><div><i>Admin</i><i>CSV</i><i>Public</i><i>Filter</i><i>Compare</i><i>Ops</i></div></div>
          <div className={styles.fieldMatrix}>{selected.fields.sort((a,b)=>a.sort_order-b.sort_order).map((field)=><article key={field.id} draggable onDragStart={()=>setDragged(field.id)} onDragOver={(e:DragEvent<HTMLElement>)=>e.preventDefault()} onDrop={()=>void reorder(field.id)}><GripVertical/><div><span>{field.section_key}</span><strong>{field.label_fr}</strong><small>{field.field_key} · {field.field_type}{field.required?' · REQUIRED':''}</small></div>{(['admin_visible','csv_enabled','public_visible','filter_enabled','comparison_enabled','operations_visible'] as const).map((key)=><button type="button" key={key} data-active={field[key]} onClick={()=>void patchField(field,{[key]:!field[key]})}>{field[key]?<Check size={15}/>:null}</button>)}</article>)}</div>
        </section>
        <aside className={styles.schemaInspector}><span>SCHEMA INSPECTOR</span><h2>Autorités et templates</h2><label><span>Studio Admin</span><input defaultValue={selected.admin_studio_template} onBlur={(e)=>void patchSchema({admin_studio_template:e.target.value})}/></label><label><span>Expérience publique</span><input defaultValue={selected.public_experience_template} onBlur={(e)=>void patchSchema({public_experience_template:e.target.value})}/></label><label><span>Conversion</span><input defaultValue={selected.conversion_template} onBlur={(e)=>void patchSchema({conversion_template:e.target.value})}/></label><label><span>Handover opérationnel</span><input defaultValue={selected.operations_handover_type} onBlur={(e)=>void patchSchema({operations_handover_type:e.target.value})}/></label><label><span>Carte homepage</span><input defaultValue={selected.homepage_card_template} onBlur={(e)=>void patchSchema({homepage_card_template:e.target.value})}/></label><div className={styles.tagCloud}>{selected.pricing_modes.map((mode)=><i key={mode}>{mode}</i>)}</div><button className={styles.primaryButton} onClick={()=>void patchSchema({status:selected.status==='active'?'paused':'active'})}>{selected.status==='active'?<Pause/>:<Play/>}{selected.status==='active'?'Mettre en pause':'Activer immédiatement'}</button><a className={styles.secondaryButton} href={`/angelcare-marketplace/admin/category-native/archetypes/${selected.schema_key}`}><Eye/> Ouvrir le studio natif</a><a className={styles.secondaryButton} href={`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}/template`}><FileSpreadsheet/> Télécharger CSV</a></aside>
      </>:null}
    </section>
  </main>
}
