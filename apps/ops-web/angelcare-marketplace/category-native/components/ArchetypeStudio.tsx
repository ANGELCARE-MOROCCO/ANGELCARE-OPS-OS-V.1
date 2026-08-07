'use client'

import { useMemo, useState } from 'react'
import { BadgeDollarSign, Boxes, CalendarDays, CheckCircle2, FileSpreadsheet, GalleryHorizontal, Globe2, Layers3, MapPin, Save, Search, ShieldCheck, Sparkles, Truck, Users } from 'lucide-react'
import styles from '../category-native.module.css'
import type { ExperienceFieldBlueprint, ExperienceSchemaRecord } from '../types'
import { categoryNativeRequest, useCategoryNativeMutation } from './CategoryNativeClient'

function FieldEditor({ field }: { field: ExperienceFieldBlueprint }) {
  const common={name:field.field_key,required:field.required,'data-field-key':field.field_key}
  if(field.field_type==='boolean') return <label className={styles.nativeCheck}><input {...common} type="checkbox"/><span><strong>{field.label_fr}</strong><small>{field.help_fr}</small></span></label>
  if(['textarea','richtext'].includes(field.field_type)) return <label className={styles.nativeField}><span>{field.label_fr}{field.required?' *':''}</span><textarea {...common} rows={field.field_type==='richtext'?7:4} placeholder={field.help_fr}/></label>
  if(field.allowed_values.length) return <label className={styles.nativeField}><span>{field.label_fr}{field.required?' *':''}</span><select {...common} multiple={field.field_type==='multiselect'}><option value="">Sélectionner…</option>{field.allowed_values.map((value)=><option key={value}>{value}</option>)}</select><small>{field.help_fr}</small></label>
  if(['list','territory_list','media_list'].includes(field.field_type)) return <label className={styles.nativeField}><span>{field.label_fr}{field.required?' *':''}</span><input {...common} placeholder="Valeurs séparées par |"/><small>{field.help_fr}</small></label>
  const type=['number','integer','money'].includes(field.field_type)?'number':['date','datetime','time'].includes(field.field_type)?(field.field_type==='datetime'?'datetime-local':field.field_type):'text'
  return <label className={styles.nativeField}><span>{field.label_fr}{field.required?' *':''}</span><input {...common} type={type} step={field.field_type==='money'?'0.01':undefined} placeholder={field.help_fr}/><small>{field.help_fr}</small></label>
}

const familyIcons: Record<string, typeof Boxes> = { product:Boxes, service:CalendarDays, academy:Users, b2b:Globe2, saas:Layers3, assessment:ShieldCheck }
function studioFamily(schema: ExperienceSchemaRecord){const name=`${schema.admin_studio_template} ${schema.vertical_key}`.toLowerCase();if(name.includes('flash')||name.includes('kit')||name.includes('product')||name.includes('game')||name.includes('digital'))return'product';if(name.includes('academy')||name.includes('course')||name.includes('cohort')||name.includes('training'))return'academy';if(name.includes('partner'))return'saas';if(name.includes('quality')||name.includes('assessment'))return'assessment';if(schema.segment_key==='b2b')return'b2b';return'service'}

export function ArchetypeStudio({ schemas, initialSchema }: { schemas: ExperienceSchemaRecord[]; initialSchema: ExperienceSchemaRecord | null }) {
  const [selectedKey,setSelectedKey]=useState(initialSchema?.schema_key||schemas[0]?.schema_key||'')
  const [query,setQuery]=useState('')
  const mutation=useCategoryNativeMutation()
  const schema=schemas.find((entry)=>entry.schema_key===selectedKey)||null
  const filtered=useMemo(()=>schemas.filter((entry)=>`${entry.name_fr} ${entry.schema_key}`.toLowerCase().includes(query.toLowerCase())),[schemas,query])
  const family=schema?studioFamily(schema):'product'; const Icon=familyIcons[family]||Boxes
  const sections=useMemo(()=>schema?Array.from(new Set(schema.fields.filter((field)=>field.admin_visible).map((field)=>field.section_key))):[],[schema])

  async function save(event: React.FormEvent<HTMLFormElement>){event.preventDefault();if(!schema)return;const form=new FormData(event.currentTarget);const configuration:Record<string,unknown>={};for(const field of schema.fields.filter((entry)=>entry.admin_visible)){const values=form.getAll(field.field_key);configuration[field.field_key]=field.field_type==='boolean'?form.has(field.field_key):field.field_type==='multiselect'?values.map(String):values.length>1?values.map(String):String(values[0]??'')}
    await mutation.run(()=>categoryNativeRequest('/api/angelcare-marketplace/admin/commerce/catalog-items',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:configuration.name_fr||schema.name_fr,item_key:configuration.item_key||configuration.service_key||configuration.solution_key||`${schema.schema_key}-${Date.now()}`,slug:configuration.slug||'',kind:family==='product'?'product':family==='academy'?'training':family==='saas'?'saas_module':family==='assessment'?'audit':'service',sellable_type:schema.archetype_key,status:'draft',experience_schema_key:schema.schema_key,experience_schema_version:schema.version,experience_configuration:configuration,summary:configuration.short_description_fr||schema.description_fr,description:configuration.full_description_fr||schema.description_fr,price_mode:configuration.price_mode||configuration.pricing_mode||schema.pricing_modes[0]||'quote_only'})}),'Objet category-native créé. Ouvrez sa fiche pour compléter média, prix et disponibilité.')
  }

  return <main className={styles.shell} data-family={family}>
    <section className={styles.nativeHero}><div><span>CATEGORY-NATIVE ADMIN STUDIO</span><h1>{schema?.name_fr||'Studio d’archétype'}</h1><p>{schema?.description_fr}</p><div>{schema?.pricing_modes.map((mode)=><i key={mode}><BadgeDollarSign size={14}/>{mode}</i>)}</div></div><Icon size={74}/></section>
    <section className={styles.nativeLayout}>
      <aside className={styles.nativePicker}><label><Search/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Trouver un archétype"/></label>{filtered.map((entry)=><button key={entry.schema_key} data-selected={entry.schema_key===selectedKey} onClick={()=>setSelectedKey(entry.schema_key)}><span>{entry.segment_key}</span><strong>{entry.name_fr}</strong><small>{entry.category_key} / {entry.subcategory_key}</small></button>)}</aside>
      {schema?<form className={styles.nativeForm} onSubmit={save}><header><div><span>{schema.admin_studio_template}</span><h2>Configuration commerciale complète</h2></div><div className={styles.studioTruth}><CheckCircle2/><span>{schema.fields.filter((field)=>field.required).length} exigences structurelles</span></div></header>{sections.map((section)=><section key={section}><div className={styles.nativeSectionTitle}><span>{section.replaceAll('_',' ')}</span>{section.includes('media')?<GalleryHorizontal/>:section.includes('availability')?<MapPin/>:section.includes('pricing')?<BadgeDollarSign/>:section.includes('delivery')?<Truck/>:<Sparkles/>}</div><div className={styles.nativeFieldGrid}>{schema.fields.filter((field)=>field.admin_visible&&field.section_key===section).sort((a,b)=>a.sort_order-b.sort_order).map((field)=><FieldEditor field={field} key={field.field_key}/>)}</div></section>)}<div className={styles.stickyPublish}><div><strong>Admin décide. Admin enregistre.</strong><span>Le schéma conserve la continuité vers CSV, homepage et Mega ZIP 2.</span></div><button disabled={mutation.busy}><Save/> Créer le brouillon natif</button></div>{(mutation.message||mutation.error)&&<div className={styles.notice} data-error={Boolean(mutation.error)}>{mutation.error||mutation.message}</div>}</form>:null}
      {schema?<aside className={styles.nativeIntelligence}><span>EXPERIENCE CONTRACT</span><h2>Continuité garantie</h2><article><Globe2/><div><strong>Public</strong><small>{schema.public_experience_template}</small></div></article><article><FileSpreadsheet/><div><strong>CSV</strong><small>{schema.schema_key}.csv</small></div></article><article><Layers3/><div><strong>Homepage</strong><small>{schema.homepage_card_template}</small></div></article><article><Truck/><div><strong>Handover</strong><small>{schema.operations_handover_type}</small></div></article><h3>Filtres futurs</h3><div className={styles.tagCloud}>{schema.search_filters.map((entry)=><i key={entry}>{entry}</i>)}</div><h3>Comparaison</h3><div className={styles.tagCloud}>{schema.comparison_fields.map((entry)=><i key={entry}>{entry}</i>)}</div></aside>:null}
    </section>
  </main>
}
