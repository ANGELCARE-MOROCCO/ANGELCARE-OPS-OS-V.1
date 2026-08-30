'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Check, ChevronRight, Eye, FileSpreadsheet, GripVertical, Layers3, Pause, Play, Search, X } from 'lucide-react'
import styles from '../category-native.module.css'
import type { CategoryNativeStudioData, ExperienceSchemaFieldRecord, ExperienceSchemaRecord } from '../types'
import { categoryNativeRequest, useCategoryNativeMutation } from './CategoryNativeClient'

export function SchemaArchitectureStudio({ initialData, canManage = false }: { initialData: CategoryNativeStudioData; canManage?: boolean }) {
  const [schemas,setSchemas] = useState(initialData.schemas)
  const [selectedKey,setSelectedKey] = useState(initialData.schemas[0]?.schema_key || '')
  const [query,setQuery] = useState('')
  const [dragged,setDragged] = useState<string | null>(null)
  const statusDialogRef = useRef<HTMLDialogElement>(null)
  const mutation = useCategoryNativeMutation()
  const filtered = useMemo(()=>schemas.filter((schema)=>`${schema.name_fr} ${schema.schema_key} ${schema.segment_key} ${schema.vertical_key}`.toLowerCase().includes(query.toLowerCase())),[schemas,query])
  const selected = schemas.find((schema)=>schema.schema_key===selectedKey) || null

  async function patchSchema(payload: Record<string,unknown>) {
    if (!selected || !canManage) return false
    const result = await mutation.run(()=>categoryNativeRequest<{record:ExperienceSchemaRecord}>(`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),'Schéma enregistré et versionné.')
    if (result) setSchemas((current)=>current.map((item)=>item.schema_key===result.record.schema_key?result.record:item))
    return Boolean(result)
  }
  async function patchField(field: ExperienceSchemaFieldRecord, payload: Record<string,unknown>) {
    if (!selected || !canManage) return
    const result = await mutation.run(()=>categoryNativeRequest<{record:ExperienceSchemaFieldRecord}>(`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}/fields/${field.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),'Champ synchronisé sur Admin, CSV, public et opérations.')
    if (result) setSchemas((current)=>current.map((schema)=>schema.schema_key===selected.schema_key?{...schema,fields:schema.fields.map((entry)=>entry.id===field.id?result.record:entry)}:schema))
  }
  async function reorder(targetId: string) {
    if (!canManage || !selected || !dragged || dragged===targetId) return
    const fields=[...selected.fields]; const from=fields.findIndex((field)=>field.id===dragged); const to=fields.findIndex((field)=>field.id===targetId)
    if(from<0||to<0)return; const [moved]=fields.splice(from,1); fields.splice(to,0,moved); setDragged(null)
    setSchemas((current)=>current.map((schema)=>schema.schema_key===selected.schema_key?{...schema,fields}:schema))
    await mutation.run(()=>categoryNativeRequest(`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}/fields/reorder`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ordered_ids:fields.map((field)=>field.id)})}),'Ordre de studio appliqué.')
  }

  return <main className={styles.shell}>
    <header className={styles.approvedPageHeading}><div><span>CATÉGORIES & COLLECTIONS · OUTILS AVANCÉS</span><h1>Experience Schema Architecture</h1><p>Gouvernez le contrat vivant entre Backoffice, CSV, expérience publique et handover opérationnel, champ par champ.</p></div><div className={styles.approvedHeadingActions}><Link href="/angelcare-marketplace/admin/category-native/template-factory"><FileSpreadsheet/> Template Factory</Link><Link data-primary href="/angelcare-marketplace/admin/category-native/archetypes"><Layers3/> Studios natifs</Link></div></header>
    {(mutation.message||mutation.error)&&<div className={styles.notice} data-error={Boolean(mutation.error)}>{mutation.error||mutation.message}<button onClick={mutation.clear}>×</button></div>}
    <section className={styles.architectureLayout}>
      <aside className={styles.schemaRail}><label><Search size={16}/><span className={styles.srOnly}>Rechercher un schéma</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Schéma, segment, verticale…"/></label><div>{filtered.map((schema)=><button type="button" key={schema.schema_key} data-selected={selectedKey===schema.schema_key} onClick={()=>setSelectedKey(schema.schema_key)}><span>{schema.segment_key}</span><strong>{schema.name_fr}</strong><small>{schema.vertical_key} · v{schema.version}</small><i data-active={schema.status==='active'}>{schema.status}</i><ChevronRight size={16}/></button>)}</div>{!filtered.length?<div className={styles.emptyState}>Aucun schéma ne correspond à la recherche.</div>:null}</aside>
      {selected?<>
        <section className={styles.schemaCanvas}>
          <header><div><span>{selected.segment_key} / {selected.vertical_key} / {selected.category_key}</span><h2>{selected.name_fr}</h2><p>{selected.description_fr}</p></div><div><b>{selected.fields.length}</b><span>champs</span></div></header>
          <div className={styles.flowMap}><article><span>ADMIN</span><strong>{selected.admin_studio_template}</strong></article><ChevronRight/><article><span>CSV</span><strong>{selected.schema_key}.csv</strong></article><ChevronRight/><article><span>PUBLIC</span><strong>{selected.public_experience_template}</strong></article><ChevronRight/><article><span>HANDOVER</span><strong>{selected.operations_handover_type}</strong></article></div>
          <div className={styles.fieldMatrixHeader}><span>FIELD ARCHITECTURE</span><div><i>Admin</i><i>CSV</i><i>Public</i><i>Filter</i><i>Compare</i><i>Ops</i></div></div>
          <div className={styles.fieldMatrix}>{[...selected.fields].sort((a,b)=>a.sort_order-b.sort_order).map((field)=><article key={field.id} draggable={canManage} onDragStart={()=>setDragged(field.id)} onDragOver={(e:DragEvent<HTMLElement>)=>{if(canManage)e.preventDefault()}} onDrop={()=>void reorder(field.id)}><GripVertical/><div><span>{field.section_key}</span><strong>{field.label_fr}</strong><small>{field.field_key} · {field.field_type}{field.required?' · REQUIRED':''}</small></div>{(['admin_visible','csv_enabled','public_visible','filter_enabled','comparison_enabled','operations_visible'] as const).map((key)=><button type="button" key={key} disabled={!canManage} title={!canManage?'Permission marketplace.experience_schema.manage requise':undefined} aria-label={`${field.label_fr} · ${key}`} data-active={field[key]} onClick={()=>void patchField(field,{[key]:!field[key]})}>{field[key]?<Check size={15}/>:null}</button>)}</article>)}</div>
        </section>
        <aside className={styles.schemaInspector}><span>SCHEMA INSPECTOR</span><h2>Autorités et templates</h2><label><span>Studio Admin</span><input disabled={!canManage} defaultValue={selected.admin_studio_template} onBlur={(e)=>void patchSchema({admin_studio_template:e.target.value})}/></label><label><span>Expérience publique</span><input disabled={!canManage} defaultValue={selected.public_experience_template} onBlur={(e)=>void patchSchema({public_experience_template:e.target.value})}/></label><label><span>Conversion</span><input disabled={!canManage} defaultValue={selected.conversion_template} onBlur={(e)=>void patchSchema({conversion_template:e.target.value})}/></label><label><span>Handover opérationnel</span><input disabled={!canManage} defaultValue={selected.operations_handover_type} onBlur={(e)=>void patchSchema({operations_handover_type:e.target.value})}/></label><label><span>Carte homepage</span><input disabled={!canManage} defaultValue={selected.homepage_card_template} onBlur={(e)=>void patchSchema({homepage_card_template:e.target.value})}/></label><div className={styles.tagCloud}>{selected.pricing_modes.map((mode)=><i key={mode}>{mode}</i>)}</div><button type="button" className={styles.primaryButton} disabled={!canManage||mutation.busy} title={!canManage?'Permission marketplace.experience_schema.manage requise':undefined} onClick={()=>statusDialogRef.current?.showModal()}>{selected.status==='active'?<Pause/>:<Play/>}{selected.status==='active'?'Mettre en pause':'Activer immédiatement'}</button><Link className={styles.secondaryButton} href={`/angelcare-marketplace/admin/category-native/archetypes/${selected.schema_key}`}><Eye/> Ouvrir le studio natif</Link><Link prefetch={false} className={styles.secondaryButton} href={`/api/angelcare-marketplace/admin/category-native/schemas/${selected.schema_key}/template`}><FileSpreadsheet/> Télécharger CSV</Link>{!canManage?<p className={styles.permissionHint}>Lecture seule · marketplace.experience_schema.manage est requise pour modifier l’architecture.</p>:null}</aside>
      </>:null}
    </section>
    {selected?<dialog ref={statusDialogRef} className={styles.importDecisionDialog}><header><div><span>COMMANDE SCHÉMA GOUVERNÉE</span><h2>{selected.status==='active'?'Mettre le schéma en pause':'Activer le schéma'}</h2></div><button type="button" onClick={()=>statusDialogRef.current?.close()} aria-label="Fermer"><X/></button></header><div className={styles.importDecisionBody}><dl><div><dt>Schéma</dt><dd>{selected.name_fr} · {selected.schema_key}</dd></div><div><dt>Version</dt><dd>v{selected.version}</dd></div><div><dt>État actuel</dt><dd>{selected.status}</dd></div><div><dt>État proposé</dt><dd>{selected.status==='active'?'paused':'active'}</dd></div></dl><p>{selected.status==='active'?'Les nouveaux usages de ce contrat seront suspendus. Les objets déjà créés et l’historique restent conservés.':'Le contrat redevient actif pour les studios natifs et les templates CSV qui le consomment.'}</p></div><footer><button type="button" disabled={mutation.busy} onClick={()=>statusDialogRef.current?.close()}>Annuler</button><button type="button" data-danger={selected.status==='active'} disabled={mutation.busy} onClick={async()=>{const done=await patchSchema({status:selected.status==='active'?'paused':'active'});if(done)statusDialogRef.current?.close()}}>Confirmer</button></footer></dialog>:null}
  </main>
}
