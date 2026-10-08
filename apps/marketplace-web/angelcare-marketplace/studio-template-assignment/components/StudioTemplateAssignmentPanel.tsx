'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, GitBranch, LayoutTemplate, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import { UniversalSourcePickerField } from '@/angelcare-marketplace/studio-picker/components/UniversalSourcePicker'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { STUDIO_TEMPLATE_PRECEDENCE, type StudioResolvedTemplate, type StudioTemplateAssignmentRecord, type StudioTemplateAssignmentScope, type StudioTemplateFamilyOption, type StudioTemplatePlacementOption } from '../types'
import styles from './studio-template-assignment.module.css'

type Envelope<T>={data?:T;error?:{message?:string};requestId?:string}
const LABELS:Record<StudioTemplateAssignmentScope,{title:string;description:string;sourceId?:string}>={
  exact_item:{title:'Produit / service exact',description:'Priorité maximale. Override uniquement cet item.',sourceId:'catalog.items'},
  placement:{title:'Placement contextuel',description:'Expérience spécifique lorsqu’un item est ouvert depuis un placement merchandising.'},
  collection:{title:'Collection contextuelle',description:'Expérience héritée lorsqu’un item est ouvert depuis cette collection.',sourceId:'homepage.collections'},
  experience_schema:{title:'Schéma Experience',description:'Template par archétype / schéma Category-Native.',sourceId:'experience.schemas'},
  category:{title:'Catégorie',description:'Template par catégorie canonique.',sourceId:'catalog.categories'},
  family:{title:'Famille commerciale',description:'Template par famille/type de sellable.'},
  marketplace_default:{title:'Défaut Marketplace',description:'Dernier fallback Studio avant le rendu natif Category-Native.'},
}
async function api<T>(url:string,init?:RequestInit):Promise<T>{const response=await fetch(url,{cache:'no-store',...init});const body=await response.json() as Envelope<T>;if(!response.ok||body.error)throw new Error(body.error?.message||'Action impossible.');return body.data as T}
const one=(value:StudioSourceReference|StudioSourceReference[]|null)=>Array.isArray(value)?value[0]||null:value

export function StudioTemplateAssignmentPanel({locale,onClose}:{locale:'fr'|'en'|'ar';onClose:()=>void}){
  const [scope,setScope]=useState<StudioTemplateAssignmentScope>('exact_item')
  const [target,setTarget]=useState<StudioSourceReference|null>(null)
  const [template,setTemplate]=useState<StudioSourceReference|null>(null)
  const [familyKey,setFamilyKey]=useState('')
  const [placementId,setPlacementId]=useState('')
  const [families,setFamilies]=useState<StudioTemplateFamilyOption[]>([])
  const [placements,setPlacements]=useState<StudioTemplatePlacementOption[]>([])
  const [current,setCurrent]=useState<StudioTemplateAssignmentRecord|null>(null)
  const [reason,setReason]=useState('Configuration du template depuis AngelCare Studio')
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
  const [testItem,setTestItem]=useState<StudioSourceReference|null>(null)
  const [testCollection,setTestCollection]=useState<StudioSourceReference|null>(null)
  const [testPlacement,setTestPlacement]=useState('')
  const [resolution,setResolution]=useState<StudioResolvedTemplate|null>(null)
  const descriptor=LABELS[scope]
  const targetReady=scope==='marketplace_default'||(scope==='family'&&Boolean(familyKey))||(scope==='placement'&&Boolean(placementId))||Boolean(target)
  const query=useMemo(()=>{const params=new URLSearchParams({scope});if(target){params.set('targetSourceId',target.sourceId);params.set('targetEntityId',target.entityId)}if(familyKey)params.set('familyKey',familyKey);if(placementId)params.set('placementId',placementId);return params.toString()},[scope,target?.sourceId,target?.entityId,familyKey,placementId])
  const loadCurrent=useCallback(async()=>{if(!targetReady){setCurrent(null);setTemplate(null);return}try{const row=await api<StudioTemplateAssignmentRecord|null>(`/api/angelcare-marketplace/cms/studio/template-assignments?${query}`);setCurrent(row);setTemplate(row?.template||null);setMessage('')}catch(error){setMessage(error instanceof Error?error.message:'Assignation indisponible.')}},[targetReady,query])
  useEffect(()=>{void Promise.all([api<{families:StudioTemplateFamilyOption[]}>('/api/angelcare-marketplace/cms/studio/template-assignments/families').then(row=>setFamilies(row.families)),api<{placements:StudioTemplatePlacementOption[]}>(`/api/angelcare-marketplace/cms/studio/template-assignments/placements?locale=${locale}`).then(row=>setPlacements(row.placements))]).catch(()=>{})},[locale])
  useEffect(()=>{void loadCurrent()},[loadCurrent])
  const changeScope=(next:StudioTemplateAssignmentScope)=>{setScope(next);setTarget(null);setFamilyKey('');setPlacementId('');setTemplate(null);setCurrent(null);setMessage('');setResolution(null)}
  async function save(remove=false){if(!targetReady){setMessage('Sélectionnez d’abord la cible.');return}if(!remove&&!template){setMessage('Sélectionnez un template Experience Core publié.');return}setBusy(true);setMessage(remove?'Retrait de l’assignation…':'Enregistrement de l’assignation…');try{const row=await api<StudioTemplateAssignmentRecord|null>('/api/angelcare-marketplace/cms/studio/template-assignments',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({scope,template:remove?null:template,target,familyKey:familyKey||null,placementId:placementId||null,reason})});setCurrent(row);setTemplate(row?.template||null);setMessage(remove?'Assignation retirée. Le niveau suivant de l’héritage reprendra autorité.':'Assignation enregistrée et auditée.')}catch(error){setMessage(error instanceof Error?error.message:'Enregistrement impossible.')}finally{setBusy(false)}}
  async function testResolver(){if(!testItem){setMessage('Choisissez un produit/service à tester.');return}setBusy(true);setResolution(null);try{const params=new URLSearchParams({itemId:testItem.entityId,locale});if(testCollection)params.set('collectionId',testCollection.entityId);if(testPlacement)params.set('placementId',testPlacement);setResolution(await api<StudioResolvedTemplate|null>(`/api/angelcare-marketplace/cms/studio/template-assignments/resolve?${params}`));setMessage('Résolution recalculée depuis les autorités canoniques.')}catch(error){setMessage(error instanceof Error?error.message:'Résolution impossible.')}finally{setBusy(false)}}
  return <div className={styles.backdrop} role="presentation" onMouseDown={onClose}><aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Templates Marketplace" onMouseDown={event=>event.stopPropagation()}>
    <header className={styles.head}><div><span>P04 · TEMPLATE ASSIGNMENT & INHERITANCE</span><strong>Templates Marketplace</strong><p>Assignez un template publié sans dupliquer les données métier. L’héritage reste déterministe et auditable.</p></div><button onClick={onClose} aria-label="Fermer"><X size={17}/></button></header>
    <div className={styles.body}>
      <section className={styles.precedence}><div className={styles.sectionTitle}><GitBranch size={16}/><div><strong>Ordre de résolution</strong><span>Le premier template publié valide gagne. Sinon, AngelCare continue vers le niveau suivant.</span></div></div><div className={styles.chain}>{STUDIO_TEMPLATE_PRECEDENCE.map((row,index)=><button key={row} type="button" data-active={scope===row} onClick={()=>changeScope(row)}><b>{index+1}</b><span>{LABELS[row].title}</span></button>)}</div></section>
      <section className={styles.card}><div className={styles.cardHead}><div><span>PORTÉE SÉLECTIONNÉE</span><strong>{descriptor.title}</strong><p>{descriptor.description}</p></div><em>Priorité {STUDIO_TEMPLATE_PRECEDENCE.indexOf(scope)+1}/7</em></div>
        {descriptor.sourceId?<UniversalSourcePickerField sourceId={descriptor.sourceId} mode="single" label="Cible Marketplace" description="Sélection canonique via P01/P02. Aucun identifiant brut." value={target} onChange={value=>setTarget(one(value))} context={{locale}}/>:null}
        {scope==='family'?<label className={styles.selectField}><span>Famille Marketplace</span><select value={familyKey} onChange={event=>setFamilyKey(event.target.value)}><option value="">Choisir une famille…</option>{families.map(row=><option key={row.key} value={row.key}>{row.label} · {row.count}</option>)}</select><small>Dérivée des schémas Category‑Native et types de catalogue existants.</small></label>:null}
        {scope==='placement'?<label className={styles.selectField}><span>Placement contextuel</span><select value={placementId} onChange={event=>setPlacementId(event.target.value)}><option value="">Choisir un placement…</option>{placements.map(row=><option key={row.id} value={row.id}>{row.label} · {row.status}{row.collectionLabel?` · ${row.collectionLabel}`:''}{row.itemLabel?` · ${row.itemLabel}`:''}</option>)}</select><small>Placements existants de la homepage. Aucun identifiant à saisir.</small></label>:null}
        {scope==='marketplace_default'?<div className={styles.defaultTarget}><ShieldCheck size={17}/><div><strong>Marketplace global</strong><span>Fallback Studio global avant maintien du rendu natif Category‑Native.</span></div></div>:null}
        {targetReady?<UniversalSourcePickerField sourceId="content.templates" mode="single" label="Template Experience Core publié" description="Seuls les templates publiés peuvent être enregistrés. Une sélection brouillon sera refusée côté serveur." value={template} onChange={value=>setTemplate(one(value))} context={{locale}}/>:<div className={styles.hint}>Choisissez la cible pour configurer son template.</div>}
        <label className={styles.reason}><span>Raison d’audit</span><textarea value={reason} onChange={event=>setReason(event.target.value)} maxLength={1000}/></label>
        <div className={styles.trust}>{current?<><CheckCircle2 size={16}/><div><strong>{current.templateLabel||'Template assigné'}</strong><span>{current.targetLabel} · autorité {current.authority}</span></div></>:<><AlertTriangle size={16}/><div><strong>Aucune assignation à ce niveau</strong><span>L’héritage continuera vers le niveau suivant.</span></div></>}</div>
        <div className={styles.actions}><button disabled={busy||!targetReady||!template||!reason.trim()} onClick={()=>void save(false)}><LayoutTemplate size={15}/> Enregistrer l’assignation</button><button data-danger="true" disabled={busy||!current||!reason.trim()} onClick={()=>void save(true)}><Trash2 size={15}/> Retirer</button><button disabled={busy||!targetReady} onClick={()=>void loadCurrent()}><RefreshCw size={15}/> Actualiser</button></div>
      </section>
      <section className={styles.card}><div className={styles.cardHead}><div><span>RÉSOLUTION LIVE · READ ONLY</span><strong>Tester l’héritage</strong><p>Vérifiez quel template gagnerait pour un produit/service et son contexte, sans modifier aucune donnée.</p></div></div>
        <UniversalSourcePickerField sourceId="catalog.items" mode="single" label="Produit / service à tester" value={testItem} onChange={value=>setTestItem(one(value))} context={{locale}}/>
        <UniversalSourcePickerField sourceId="homepage.collections" mode="single" label="Collection contextuelle · optionnel" value={testCollection} onChange={value=>setTestCollection(one(value))} context={{locale}}/>
        <label className={styles.selectField}><span>Placement · optionnel</span><select value={testPlacement} onChange={event=>setTestPlacement(event.target.value)}><option value="">Aucun placement</option>{placements.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
        <button className={styles.resolveButton} disabled={busy||!testItem} onClick={()=>void testResolver()}><GitBranch size={15}/> Résoudre maintenant</button>
        {resolution?<div className={styles.resolution} data-resolved={resolution.status==='RESOLVED'}><header><strong>{resolution.status==='RESOLVED'?'Template Studio résolu':'Fallback natif conservé'}</strong><span>{resolution.status==='RESOLVED'?`${resolution.templateKey} · ${resolution.matchedScope}`:'Aucune assignation publiée valide. AdaptiveExperience reste autoritaire.'}</span></header><div>{resolution.provenance.map((row,index)=><article key={row.scope} data-state={row.status}><b>{index+1}</b><div><strong>{LABELS[row.scope].title}</strong><span>{row.status} · {row.detail}</span></div></article>)}</div></div>:null}
        {message?<p className={styles.message}>{message}</p>:null}
      </section>
    </div>
  </aside></div>
}
