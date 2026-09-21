'use client'

import {useEffect,useState} from 'react'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { UniversalSourcePickerField } from '@/angelcare-marketplace/studio-picker/components/UniversalSourcePicker'
import {isStudioSourceReference} from '@/angelcare-marketplace/studio-picker/reference'
import styles from './studio-workspace.module.css'

export function MediaField({value,onChange}:{value:string|StudioSourceReference|null|undefined;onChange:(value:StudioSourceReference|null)=>void}){
  return <UniversalSourcePickerField sourceId="media.assets" label="Media Vault" description="Choisissez un média existant depuis la source canonique AngelCare." value={value} onChange={next=>onChange(Array.isArray(next)?next[0]||null:next)} legacyValueField="asset_key"/>
}

type PreviewItem={id:string;title:string;subtitle?:string;image?:{url:string};metadata?:Record<string,unknown>}
export function RecordField({kind,value,onChange}:{kind:'category'|'collection';value:string|StudioSourceReference|null|undefined;onChange:(value:StudioSourceReference|null)=>void}){
  const category=kind==='category',ref=isStudioSourceReference(value)?value:null
  const[preview,setPreview]=useState<{items:PreviewItem[];total:number}|null>(null),[error,setError]=useState('')
  useEffect(()=>{if(!ref){setPreview(null);setError('');return}const controller=new AbortController(),recipe={version:1,sourceId:'catalog.items',strategy:category?'category_items':'collection_items',limit:8,emptyPolicy:'empty',...(category?{category:ref}:{collection:ref})};fetch('/api/angelcare-marketplace/cms/studio/dynamic-sources/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({recipe}),signal:controller.signal}).then(async r=>{const b=await r.json();if(!r.ok||b.error)throw new Error(b.error?.message||'Aperçu indisponible.');setPreview({items:(b.data?.result?.items||[]).slice(0,8),total:Number(b.data?.result?.total||0)});setError('')}).catch(e=>{if(e?.name!=='AbortError')setError(e instanceof Error?e.message:'Aperçu indisponible.')});return()=>controller.abort()},[category,ref?.entityId,ref?.sourceId])
  return <div className={styles.canonicalRecordField}><UniversalSourcePickerField sourceId={category?'catalog.categories':'homepage.collections'} label={category?'Catégorie Marketplace':'Collection Marketplace'} description={category?'Sélection hiérarchique depuis le catalogue canonique.':'Sélection depuis les collections gouvernées du Marketplace.'} value={value} onChange={next=>onChange(Array.isArray(next)?next[0]||null:next)} legacyValueField={category?'category_key':'collection_key'}/>{ref?<div className={styles.canonicalPreview}><header><strong>{category?'Contenu éligible':'Membres éligibles'}</strong><span>{preview?`${preview.total} résultat(s)`:'Chargement…'}</span></header>{error?<p>{error}</p>:null}{preview?.items.length?<div>{preview.items.map(row=><article key={row.id}>{row.image?.url?<img src={row.image.url} alt=""/>:<i/>}<span><b>{row.title}</b><small>{row.subtitle||String(row.metadata?.availability_status||'Ressource canonique')}</small></span></article>)}</div>:null}</div>:null}</div>
}
