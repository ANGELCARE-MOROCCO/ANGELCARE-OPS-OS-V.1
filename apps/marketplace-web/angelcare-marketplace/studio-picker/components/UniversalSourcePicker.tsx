'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronRight, ExternalLink, File, FolderTree, Image as ImageIcon, Loader2, RefreshCcw, Search, X } from 'lucide-react'
import type { StudioSourceDescriptor, StudioSourceEntity, StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { getPickerSource, listPickerSources, searchPickerSource, StudioPickerApiError, validatePickerReference } from '../client'
import { studioSourceAdminHref } from '../admin-destinations'
import { exactLegacyEntity, isStudioSourceReference, normalizeSourceReferences } from '../reference'
import type { UniversalPickerFilter, UniversalPickerProps } from '../types'
import styles from './universal-source-picker.module.css'

const PAGE_SIZE=24
const statusLabel=(value?:string)=>{
  const s=String(value||'').toLowerCase()
  if(['published','active','approved','eligible','scheduled'].includes(s))return 'Actif'
  if(['draft','review','in_review','submitted'].includes(s))return 'Brouillon'
  if(['archived','disabled','deleted'].includes(s))return 'Indisponible'
  return value||''
}
const statusTone=(value?:string)=>{
  const s=String(value||'').toLowerCase()
  if(['published','active','approved','eligible','scheduled'].includes(s))return 'positive'
  if(['draft','review','in_review','submitted'].includes(s))return 'warning'
  if(['archived','disabled','deleted'].includes(s))return 'negative'
  return 'neutral'
}
const refKey=(ref:StudioSourceReference)=>`${ref.sourceId}:${ref.entityId}`
const humanError=(error:unknown)=>{
  if(error instanceof StudioPickerApiError){
    if(error.status===401||error.status===403||error.code==='PERMISSION_DENIED')return {kind:'denied' as const,message:'Vous n’avez pas accès à cette source Marketplace.',requestId:error.requestId}
    return {kind:'error' as const,message:error.message||'Impossible de charger cette source.',requestId:error.requestId}
  }
  return {kind:'error' as const,message:'Impossible de charger cette source Marketplace.'}
}

function SourceThumbnail({entity,media}:{entity:StudioSourceEntity;media:boolean}){
  if(entity.image?.url)return <img className={styles.thumb} src={entity.image.url} alt={entity.image.alt||entity.title}/>
  return <div className={styles.thumbFallback}>{media?<ImageIcon size={20}/>:<File size={20}/>}</div>
}

function SelectionCard({entity,reference,onRemove,adminBridge,validation}:{entity?:StudioSourceEntity;reference:StudioSourceReference;onRemove?:()=>void;adminBridge?:boolean;validation?:{status:string;reason?:string}}){
  const href=adminBridge&&validation?.status!=='NOT_AUTHORIZED'&&validation?.status!=='NOT_FOUND'?studioSourceAdminHref(reference):null
  const invalid=validation&&validation.status!=='VALID'
  const invalidTitle=validation?.status==='NOT_AUTHORIZED'?'Accès retiré':validation?.status==='NOT_PUBLISHED'?'Élément non publié':validation?.status==='DISABLED'?'Élément indisponible':validation?.status==='NOT_FOUND'?'Référence indisponible':validation?.status==='SOURCE_UNKNOWN'?'Source inconnue':validation?.status==='UNSUPPORTED'?'Source non supportée':''
  return <div className={styles.selectedCard} data-invalid={invalid||undefined}>
    <SourceThumbnail entity={entity||{sourceId:reference.sourceId,id:reference.entityId,title:'Ressource sélectionnée',badges:[],canonicalRef:reference,metadata:{}}} media={reference.sourceId==='media.assets'}/>
    <div className={styles.selectedCopy}><strong>{invalidTitle||entity?.title||'Ressource sélectionnée'}</strong><span>{invalid?(validation?.reason||'Cette référence doit être remplacée ou retirée.'):entity?.subtitle||reference.sourceId}</span>{entity?.status?<em data-tone={statusTone(entity.status)}>{statusLabel(entity.status)}</em>:null}{invalid?<em data-tone="negative">{validation?.status}</em>:null}</div>
    <div className={styles.selectedActions}>{href?<Link href={href} target="_blank" title="Ouvrir dans l’administration"><ExternalLink size={15}/></Link>:null}{onRemove?<button type="button" onClick={onRemove} title="Retirer"><X size={15}/></button>:null}</div>
  </div>
}

function LegacySelectionCard({value,onRemove}:{value:string;onRemove:()=>void}){
  return <div className={styles.selectedCard} data-legacy="true"><div className={styles.thumbFallback}><RefreshCcw size={18}/></div><div className={styles.selectedCopy}><strong>Référence existante</strong><span>Compatible · sera convertie lors du prochain choix</span></div><button className={styles.iconButton} type="button" onClick={onRemove} title="Retirer"><X size={15}/></button><span className={styles.srOnly}>{value}</span></div>
}

export function UniversalSourcePicker(props:UniversalPickerProps){
  const {sourceId,allowedSources,mode='single',value,onChange,label='Sélection Marketplace',description,required=false,disabled=false,context,filters=[],legacyValueField,adminBridge=true}=props
  const refs=useMemo(()=>normalizeSourceReferences(value),[value])
  const legacyValue=typeof value==='string'?value:''
  const [open,setOpen]=useState(false)
  const [activeSource,setActiveSource]=useState(sourceId||allowedSources?.[0]||refs[0]?.sourceId||'')
  const [descriptor,setDescriptor]=useState<StudioSourceDescriptor|null>(null)
  const [availableSources,setAvailableSources]=useState<StudioSourceDescriptor[]>([])
  const [entities,setEntities]=useState<Record<string,StudioSourceEntity>>({})
  const [validations,setValidations]=useState<Record<string,{status:string;reason?:string}>>({})
  const [results,setResults]=useState<StudioSourceEntity[]>([])
  const [query,setQuery]=useState('')
  const [nextCursor,setNextCursor]=useState<string|null>(null)
  const [loading,setLoading]=useState(false)
  const [loadingMore,setLoadingMore]=useState(false)
  const [error,setError]=useState<{kind:'denied'|'error';message:string;requestId?:string}|null>(null)
  const [activeIndex,setActiveIndex]=useState(-1)
  const [pending,setPending]=useState<StudioSourceReference[]>(refs)
  const [localFilters,setLocalFilters]=useState<UniversalPickerFilter[]>(filters.map(row=>({...row})))
  const requestSeq=useRef(0)
  const requestAbort=useRef<AbortController|null>(null)
  const hydrateAbort=useRef<AbortController|null>(null)
  const dialogRef=useRef<HTMLDivElement|null>(null)
  const searchRef=useRef<HTMLInputElement|null>(null)

  useEffect(()=>{setPending(refs)},[value])
  useEffect(()=>{setLocalFilters(filters.map(row=>({...row})))},[filters])

  const hydrate=useCallback(async()=>{
    hydrateAbort.current?.abort();const controller=new AbortController();hydrateAbort.current=controller
    try{
      const rows=await Promise.all(refs.map(async reference=>{
        try{return await validatePickerReference(reference,controller.signal)}catch{return {status:'UNSUPPORTED',reference,reason:'Validation indisponible.'} as const}
      }))
      if(controller.signal.aborted)return
      setEntities(current=>{const next={...current};rows.forEach((validation,index)=>{if('entity' in validation&&validation.entity)next[refKey(refs[index])]=validation.entity});return next})
      setValidations(current=>{const next={...current};rows.forEach((validation,index)=>{next[refKey(refs[index])]={status:validation.status,reason:validation.reason}});return next})
    }finally{}
  },[refs.map(refKey).join('|')])
  useEffect(()=>{void hydrate();return()=>hydrateAbort.current?.abort()},[hydrate])

  const loadDescriptor=useCallback(async(id:string)=>{
    if(!id)return
    try{const row=await getPickerSource(id);setDescriptor(row);setError(null)}catch(err){setDescriptor(null);setError(humanError(err))}
  },[])

  const loadSources=useCallback(async()=>{
    if(!allowedSources||allowedSources.length<2)return
    try{const payload=await listPickerSources();setAvailableSources(payload.sources.filter(row=>allowedSources.includes(row.id)))}catch(err){setError(humanError(err))}
  },[(allowedSources||[]).join('|')])

  const runSearch=useCallback(async({append=false,cursor=null}:{append?:boolean;cursor?:string|null}={})=>{
    if(!activeSource)return
    requestAbort.current?.abort();const controller=new AbortController();requestAbort.current=controller
    const seq=++requestSeq.current
    append?setLoadingMore(true):setLoading(true);setError(null)
    try{
      const useBrowse=!query.trim()&&Boolean(descriptor?.capabilities.browse)
      const data=await searchPickerSource(activeSource,{query,limit:PAGE_SIZE,cursor,context,filters:localFilters,browse:useBrowse},controller.signal)
      if(controller.signal.aborted||seq!==requestSeq.current)return
      setResults(current=>append?[...current,...data.items]:data.items)
      setNextCursor(data.nextCursor)
      setActiveIndex(data.items.length?-1:-1)
    }catch(err){if(controller.signal.aborted)return;if(seq!==requestSeq.current)return;setError(humanError(err));if(!append)setResults([])}finally{if(seq===requestSeq.current){setLoading(false);setLoadingMore(false)}}
  },[activeSource,query,descriptor?.capabilities.browse,context?.locale,context?.territoryId,context?.audienceId,JSON.stringify(localFilters.map(row=>[row.key,row.value]))])

  useEffect(()=>{
    if(!open)return
    void loadSources();void loadDescriptor(activeSource)
    const timer=window.setTimeout(()=>void runSearch(),220)
    return()=>{window.clearTimeout(timer);requestAbort.current?.abort()}
  },[open,activeSource,loadSources,loadDescriptor])

  useEffect(()=>{
    if(!open||!descriptor)return
    const timer=window.setTimeout(()=>void runSearch(),220)
    return()=>window.clearTimeout(timer)
  },[query,descriptor,JSON.stringify(localFilters.map(row=>[row.key,row.value]))])

  useEffect(()=>{
    if(!open)return
    const timer=window.setTimeout(()=>searchRef.current?.focus(),30)
    return()=>window.clearTimeout(timer)
  },[open])

  useEffect(()=>{
    if(!open||!legacyValue||!activeSource||!descriptor)return
    const controller=new AbortController()
    void searchPickerSource(activeSource,{query:legacyValue,limit:20,context},controller.signal).then(data=>{
      const exact=exactLegacyEntity(data.items,legacyValue,legacyValueField);if(exact)setEntities(current=>({...current,[`legacy:${activeSource}:${legacyValue}`]:exact}))
    }).catch(()=>{})
    return()=>controller.abort()
  },[open,legacyValue,activeSource,descriptor?.id,legacyValueField])

  const isSelected=useCallback((entity:StudioSourceEntity)=>pending.some(ref=>ref.sourceId===entity.sourceId&&ref.entityId===entity.id),[pending])
  const toggle=useCallback((entity:StudioSourceEntity)=>{
    const ref=entity.canonicalRef
    setEntities(current=>({...current,[refKey(ref)]:entity}))
    if(mode==='single'){onChange(ref);setOpen(false);return}
    setPending(current=>isSelected(entity)?current.filter(row=>refKey(row)!==refKey(ref)):[...current,ref])
  },[mode,onChange,isSelected])
  const confirm=()=>{onChange(pending);setOpen(false)}
  const remove=(reference:StudioSourceReference)=>onChange(mode==='multiple'?refs.filter(row=>refKey(row)!==refKey(reference)):null)

  const sourceCandidates=availableSources.length?availableSources:descriptor?[descriptor]:[]
  const media=activeSource==='media.assets'
  const hierarchical=Boolean(descriptor?.capabilities.hierarchical)
  const parentField=activeSource==='catalog.categories'?'parent_category_id':activeSource==='context.territories'?'parent_territory_id':''
  const parentIds=new Set(results.map(row=>String(row.metadata?.[parentField]||'')).filter(Boolean))
  const roots=hierarchical&&parentField?results.filter(row=>!row.metadata?.[parentField]||!results.some(other=>other.id===String(row.metadata?.[parentField]))):results
  const childrenByParent=useMemo(()=>{const map=new Map<string,StudioSourceEntity[]>();if(!hierarchical||!parentField)return map;for(const row of results){const parent=String(row.metadata?.[parentField]||'');if(!parent)continue;map.set(parent,[...(map.get(parent)||[]),row])}return map},[results,hierarchical,parentField])
  const orderedResults=useMemo(()=>{
    if(!hierarchical||!parentField)return results
    const seen=new Set<string>(),ordered:StudioSourceEntity[]=[]
    const walk=(row:StudioSourceEntity)=>{if(seen.has(row.id))return;seen.add(row.id);ordered.push(row);for(const child of childrenByParent.get(row.id)||[])walk(child)}
    roots.forEach(walk);results.forEach(walk);return ordered
  },[results,hierarchical,parentField,childrenByParent])
  const depthOf=(entity:StudioSourceEntity)=>{
    if(!hierarchical||!parentField)return 0
    let depth=0,parent=String(entity.metadata?.[parentField]||''),guard=0
    while(parent&&guard++<6){depth++;const row=results.find(item=>item.id===parent);parent=row?String(row.metadata?.[parentField]||''):''}
    return depth
  }

  const onDialogKeyDown=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
    if(event.key==='Escape'){event.preventDefault();setOpen(false);return}
    if(event.key==='Tab'&&dialogRef.current){const focusable=[...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')].filter(el=>el.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
  }
  const onSearchKeyDown=(event:ReactKeyboardEvent<HTMLInputElement>)=>{
    if(event.key==='ArrowDown'){event.preventDefault();setActiveIndex(index=>Math.min(orderedResults.length-1,index+1))}
    if(event.key==='ArrowUp'){event.preventDefault();setActiveIndex(index=>Math.max(0,index-1))}
    if(event.key==='Enter'&&activeIndex>=0&&orderedResults[activeIndex]){event.preventDefault();toggle(orderedResults[activeIndex])}
  }

  const legacyEntity=legacyValue?entities[`legacy:${activeSource||sourceId}:${legacyValue}`]:undefined
  return <div className={styles.field} data-disabled={disabled||undefined}>
    <div className={styles.fieldHead}><div><label>{label}{required?<sup>*</sup>:null}</label>{description?<p>{description}</p>:null}</div><span className={styles.nativeBadge}>Marketplace natif</span></div>
    <div className={styles.selectionStack}>
      {refs.map(reference=><SelectionCard key={refKey(reference)} reference={reference} entity={entities[refKey(reference)]} validation={validations[refKey(reference)]} onRemove={()=>remove(reference)} adminBridge={adminBridge}/>)}
      {legacyValue&&!refs.length?(legacyEntity?<SelectionCard reference={legacyEntity.canonicalRef} entity={legacyEntity} onRemove={()=>onChange(null)} adminBridge={adminBridge}/>:<LegacySelectionCard value={legacyValue} onRemove={()=>onChange(null)}/>):null}
    </div>
    <button className={styles.openButton} type="button" disabled={disabled} onClick={()=>setOpen(true)}><Search size={16}/><span>{refs.length||legacyValue?'Modifier la sélection':'Choisir dans AngelCare Marketplace'}</span><ChevronRight size={16}/></button>
    {open?<div className={styles.overlay} onMouseDown={event=>{if(event.currentTarget===event.target)setOpen(false)}}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={label} ref={dialogRef} onKeyDown={onDialogKeyDown}>
        <header className={styles.dialogHeader}><div><span className={styles.kicker}>ANGELCARE · SOURCE CANONIQUE</span><h3>{descriptor?.labelPlural||label}</h3><p>{descriptor?.description||'Sélectionnez une ressource existante. Aucune donnée métier n’est copiée dans Studio.'}</p></div><button className={styles.closeButton} type="button" onClick={()=>setOpen(false)} aria-label="Fermer"><X size={19}/></button></header>
        {(allowedSources?.length||0)>1?<div className={styles.sourceTabs} role="tablist" aria-label="Type de source">{sourceCandidates.map(source=><button key={source.id} type="button" role="tab" aria-selected={activeSource===source.id} data-active={activeSource===source.id||undefined} onClick={()=>{setActiveSource(source.id);setQuery('');setResults([]);setNextCursor(null)}}>{source.labelPlural}</button>)}</div>:null}
        <div className={styles.toolbar}><div className={styles.searchBox}><Search size={17}/><input ref={searchRef} value={query} onChange={event=>{setQuery(event.target.value);setActiveIndex(-1)}} onKeyDown={onSearchKeyDown} placeholder={`Rechercher dans ${descriptor?.labelPlural?.toLocaleLowerCase('fr')||'Marketplace'}…`} aria-label="Rechercher"/><kbd>⌘ K</kbd></div>{localFilters.map(filter=><label className={styles.filter} key={filter.key}><span>{filter.label}</span><select value={filter.value||''} onChange={event=>setLocalFilters(current=>current.map(row=>row.key===filter.key?{...row,value:event.target.value}:row))}><option value="">Tous</option>{filter.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</div>
        <div className={styles.metaBar}><div><strong>{descriptor?.labelPlural||'Ressources'}</strong>{descriptor?<span>{descriptor.authority.canonical?'Source canonique':'Source'} · {descriptor.capabilities.multiSelect?'multi-sélection':'sélection'} · {descriptor.governance.publicationAware?'état publication visible':'référence gouvernée'}</span>:null}</div>{mode==='multiple'?<b>{pending.length} sélection{pending.length>1?'s':''}</b>:null}</div>
        <main className={styles.results} data-media={media||undefined} role="listbox" aria-multiselectable={mode==='multiple'} aria-busy={loading}>
          {loading?<div className={styles.state}><Loader2 className={styles.spin} size={24}/><strong>Connexion aux sources AngelCare…</strong><span>Chargement borné et permission-aware.</span></div>:null}
          {!loading&&error?<div className={styles.state} data-error="true">{error.kind==='denied'?<AlertTriangle size={24}/>:<RefreshCcw size={24}/>}<strong>{error.message}</strong>{error.requestId?<span>Référence technique : {error.requestId}</span>:null}<button type="button" onClick={()=>void runSearch()}>Réessayer</button></div>:null}
          {!loading&&!error&&!orderedResults.length?<div className={styles.state}><Search size={24}/><strong>{query?'Aucun résultat pour cette recherche.':'Aucune ressource disponible.'}</strong><span>{query?'Essayez un autre terme ou retirez un filtre.':'La source canonique est vide ou ne contient aucun élément accessible.'}</span></div>:null}
          {!loading&&!error&&orderedResults.map((entity,index)=>{
            const selected=isSelected(entity),depth=depthOf(entity)
            return <button type="button" key={`${entity.sourceId}:${entity.id}`} className={styles.resultCard} data-selected={selected||undefined} data-active={activeIndex===index||undefined} role="option" aria-selected={selected} onMouseEnter={()=>setActiveIndex(index)} onClick={()=>toggle(entity)} style={hierarchical?({'--picker-depth':depth} as CSSProperties):undefined}>
              {hierarchical?<span className={styles.treeRail}>{depth?<ChevronRight size={13}/>:<FolderTree size={15}/>}</span>:null}<SourceThumbnail entity={entity} media={media}/><span className={styles.resultCopy}><strong>{entity.title}</strong>{entity.subtitle?<span>{entity.subtitle}</span>:null}<small>{entity.badges.slice(0,3).map((badge,badgeIndex)=><em key={`${badge.label}-${badgeIndex}`}>{badge.value||badge.label}</em>)}</small></span>{entity.status?<span className={styles.status} data-tone={statusTone(entity.status)}>{statusLabel(entity.status)}</span>:null}<span className={styles.check}>{selected?<Check size={16}/>:null}</span>
            </button>
          })}
          {!loading&&!error&&nextCursor?<button className={styles.loadMore} type="button" disabled={loadingMore} onClick={()=>void runSearch({append:true,cursor:nextCursor})}>{loadingMore?<Loader2 className={styles.spin} size={16}/>:<ChevronDown size={16}/>} Charger davantage</button>:null}
        </main>
        <footer className={styles.footer}><div><span>Références canoniques</span><strong>sourceId + entityId</strong></div><div><button type="button" className={styles.cancel} onClick={()=>setOpen(false)}>Annuler</button>{mode==='multiple'?<button type="button" className={styles.confirm} onClick={confirm} disabled={required&&!pending.length}>Confirmer {pending.length?`(${pending.length})`:''}</button>:null}</div></footer>
      </div>
    </div>:null}
  </div>
}

export function UniversalSourcePickerField(props:UniversalPickerProps){return <UniversalSourcePicker {...props}/>}
