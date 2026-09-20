'use client'

import { useMemo, useState } from 'react'
import { DatabaseZap, Eye, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react'
import { UniversalSourcePickerField } from '@/angelcare-marketplace/studio-picker/components/UniversalSourcePicker'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { isStudioDynamicSourceReference, studioDynamicSourceProfile, STUDIO_DYNAMIC_SOURCE_PROFILES } from '../registry'
import type { StudioDynamicSourceReference, StudioDynamicStrategy } from '../types'
import styles from './studio-dynamic-source.module.css'

type Envelope<T>={data?:T;error?:{message?:string};requestId?:string}
const strategyLabels:Record<StudioDynamicStrategy,string>={source_query:'Requête canonique',catalog_published:'Catalogue publié',catalog_featured:'Offres mises en avant',catalog_available:'Disponibles maintenant',catalog_newest:'Nouveautés',merchandising_popular:'Placement · populaire',merchandising_best_pick:'Placement · best pick',merchandising_new_arrival:'Placement · nouvelle arrivée',category_items:'Offres d’une catégorie',collection_items:'Offres d’une collection',experience_schema_items:'Offres d’un schéma Experience'}
const emptyLabels={preserve_static:'Conserver le contenu statique',empty:'Afficher une liste vide',hide_block:'Masquer le bloc'} as const
const sortLabels={canonical:'Ordre canonique',recommended:'Recommandé',newest:'Plus récent',price_asc:'Prix croissant',price_desc:'Prix décroissant'} as const
const sourceLabel=(id:string)=>studioDynamicSourceProfile(id)?.label||id

function defaultRecipe(sourceId:string):StudioDynamicSourceReference{const p=studioDynamicSourceProfile(sourceId)||STUDIO_DYNAMIC_SOURCE_PROFILES[0];return{version:1,sourceId:p.sourceId,strategy:'source_query',query:'',filters:{},sort:p.allowedSorts[0]||'canonical',limit:p.defaultLimit,context:{territoryMode:'inherit',audienceMode:'inherit'},emptyPolicy:'preserve_static'}}
const ref=(v:StudioSourceReference|StudioSourceReference[]|null)=>Array.isArray(v)?v[0]||null:v

export function StudioDynamicSourceField({value,onChange,allowedSources}:{value:unknown;onChange:(value:StudioDynamicSourceReference|null)=>void;allowedSources:readonly string[]}){
  const eligible=useMemo(()=>STUDIO_DYNAMIC_SOURCE_PROFILES.filter(row=>allowedSources.includes(row.sourceId)),[allowedSources])
  const current=isStudioDynamicSourceReference(value)?value:null
  const [enabled,setEnabled]=useState(Boolean(current)),[preview,setPreview]=useState<{items:Array<{id:string;title:string;subtitle?:string;status?:string}>;total:number}|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('')
  const recipe=current||defaultRecipe(eligible[0]?.sourceId||'catalog.items'),profile=studioDynamicSourceProfile(recipe.sourceId)||eligible[0]
  const update=(patch:Partial<StudioDynamicSourceReference>)=>{setPreview(null);setError('');onChange({...recipe,...patch,version:1} as StudioDynamicSourceReference)}
  const setSource=(sourceId:string)=>onChange(defaultRecipe(sourceId))
  const test=async()=>{setLoading(true);setError('');try{const response=await fetch('/api/angelcare-marketplace/cms/studio/dynamic-sources/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({recipe})});const body=await response.json() as Envelope<any>;if(!response.ok||body.error)throw new Error(body.error?.message||'Source dynamique indisponible.');setPreview({items:(body.data?.result?.items||[]).slice(0,6),total:Number(body.data?.result?.total||0)})}catch(e){setError(e instanceof Error?e.message:'Source dynamique indisponible.')}finally{setLoading(false)}}
  if(!eligible.length)return <div className={styles.notice}>Aucune source dynamique n’est autorisée pour ce bloc.</div>
  if(!enabled)return <div className={styles.field}><div className={styles.head}><div><span>Source dynamique</span><strong>Contenu statique</strong><p>Activez une source Marketplace pour alimenter ce bloc à la demande sans copier les données métier.</p></div><button type="button" onClick={()=>{setEnabled(true);onChange(defaultRecipe(eligible[0].sourceId))}}><DatabaseZap size={15}/> Activer</button></div></div>
  return <div className={styles.field}>
    <div className={styles.head}><div><span>SOURCE DYNAMIQUE · P06</span><strong>{sourceLabel(recipe.sourceId)}</strong><p>Données résolues à la demande depuis l’autorité canonique. La page ne stocke que cette recette.</p></div><button type="button" className={styles.disable} onClick={()=>{setEnabled(false);onChange(null);setPreview(null)}}>Désactiver</button></div>
    <div className={styles.grid}>
      <label><span>Source</span><select value={recipe.sourceId} onChange={e=>setSource(e.target.value)}>{eligible.map(row=><option key={row.sourceId} value={row.sourceId}>{row.label}</option>)}</select></label>
      <label><span>Stratégie</span><select value={recipe.strategy} onChange={e=>update({strategy:e.target.value as StudioDynamicStrategy,query:'',filters:{},category:null,collection:null,experienceSchema:null})}>{profile?.allowedStrategies.map(row=><option key={row} value={row}>{strategyLabels[row]}</option>)}</select></label>
      {recipe.strategy==='source_query'?<label className={styles.wide}><span>Recherche · optionnelle</span><input value={recipe.query||''} maxLength={120} onChange={e=>update({query:e.target.value})} placeholder="Ex. postpartum, Montessori, premium…"/></label>:null}
      {recipe.sourceId==='catalog.items'&&recipe.strategy==='source_query'?<><label><span>Type d’offre</span><select value={String(recipe.filters?.kind||'')} onChange={e=>update({filters:{...(recipe.filters||{}),kind:e.target.value||null}})}><option value="">Tous</option><option value="product">Produit</option><option value="service">Service</option><option value="training">Formation</option><option value="saas">SaaS</option></select></label><label><span>Disponibilité</span><select value={String(recipe.filters?.availability_status||'')} onChange={e=>update({filters:{...(recipe.filters||{}),availability_status:e.target.value||null}})}><option value="">Toutes</option><option value="available">Disponible</option><option value="hold_required">À confirmer</option><option value="configuration_required">Configuration requise</option></select></label></>:null}
      {recipe.strategy==='category_items'?<div className={styles.wide}><UniversalSourcePickerField sourceId="catalog.categories" label="Catégorie" description="La catégorie est sélectionnée depuis la taxonomie canonique." value={recipe.category||null} onChange={v=>update({category:ref(v)})}/></div>:null}
      {recipe.strategy==='collection_items'?<div className={styles.wide}><UniversalSourcePickerField sourceId="homepage.collections" label="Collection" description="Les membres de la collection restent gouvernés par le merchandising existant." value={recipe.collection||null} onChange={v=>update({collection:ref(v)})}/></div>:null}
      {recipe.strategy==='experience_schema_items'?<div className={styles.wide}><UniversalSourcePickerField sourceId="experience.schemas" label="Schéma Experience" description="Sélection native du schéma qui gouverne la famille d’expérience." value={recipe.experienceSchema||null} onChange={v=>update({experienceSchema:ref(v)})}/></div>:null}
      <label><span>Ordre</span><select value={recipe.sort||profile?.allowedSorts[0]||'canonical'} onChange={e=>update({sort:e.target.value as any})}>{profile?.allowedSorts.map(row=><option key={row} value={row}>{sortLabels[row]}</option>)}</select></label>
      <label><span>Nombre maximum</span><select value={recipe.limit} onChange={e=>update({limit:Number(e.target.value)})}>{[4,6,8,10,12,16,18,24].filter(n=>n<=Number(profile?.maxLimit||24)).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
      <label><span>Territoire</span><select value={recipe.context?.territoryMode||'inherit'} onChange={e=>update({context:{...(recipe.context||{}),territoryMode:e.target.value as any,territory:e.target.value==='specific'?recipe.context?.territory||null:null}})}><option value="inherit">Contexte de la page</option><option value="global">Global uniquement</option><option value="specific">Territoire précis</option></select></label>
      <label><span>Audience</span><select value={recipe.context?.audienceMode||'inherit'} onChange={e=>update({context:{...(recipe.context||{}),audienceMode:e.target.value as any,audience:e.target.value==='specific'?recipe.context?.audience||null:null}})}><option value="inherit">Contexte de la page</option><option value="none">Sans audience</option><option value="specific">Audience précise</option></select></label>
      {recipe.context?.territoryMode==='specific'?<div className={styles.wide}><UniversalSourcePickerField sourceId="context.territories" label="Territoire spécifique" value={recipe.context.territory||null} onChange={v=>update({context:{...(recipe.context||{}),territoryMode:'specific',territory:ref(v)}})}/></div>:null}
      {recipe.context?.audienceMode==='specific'?<div className={styles.wide}><UniversalSourcePickerField sourceId="audience.segments" label="Audience spécifique" value={recipe.context.audience||null} onChange={v=>update({context:{...(recipe.context||{}),audienceMode:'specific',audience:ref(v)}})}/></div>:null}
      <label className={styles.wide}><span>Si la source ne retourne rien</span><select value={recipe.emptyPolicy} onChange={e=>update({emptyPolicy:e.target.value as any})}>{Object.entries(emptyLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    <div className={styles.trust}><ShieldCheck size={15}/><div><strong>Source canonique · runtime clone</strong><span>Aucune fiche, prix, disponibilité, campagne ou preuve n’est copiée dans le document Studio.</span></div></div>
    <div className={styles.previewBar}><button type="button" onClick={()=>void test()} disabled={loading}>{loading?<Loader2 className={styles.spin} size={14}/>:preview?<RefreshCcw size={14}/>:<Eye size={14}/>} Tester la source</button>{preview?<span>{preview.total} résultat(s) canonique(s)</span>:null}{error?<em>{error}</em>:null}</div>
    {preview?.items.length?<div className={styles.preview}>{preview.items.map(item=><article key={item.id}><strong>{item.title}</strong><span>{item.subtitle||item.status||'Ressource Marketplace'}</span></article>)}</div>:null}
  </div>
}
