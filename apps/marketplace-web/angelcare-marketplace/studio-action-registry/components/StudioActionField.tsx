'use client'
import { useMemo } from 'react'
import { ExternalLink, ShieldCheck, Workflow } from 'lucide-react'
import { UniversalSourcePickerField } from '@/angelcare-marketplace/studio-picker/components/UniversalSourcePicker'
import { STUDIO_ACTION_DESCRIPTORS } from '../registry'
import { isStudioActionReference, normalizeStudioActionReference, safeExternalStudioUrl } from '../reference'
import type { StudioActionReference } from '../types'
import styles from './studio-action-field.module.css'

export function StudioActionField({value,onChange,legacyHref,label='Action'}:{value:StudioActionReference|null|undefined;onChange:(value:StudioActionReference|null)=>void;legacyHref?:unknown;label?:string}){
  const current=useMemo(()=>normalizeStudioActionReference(value,legacyHref),[value,legacyHref])
  const descriptor=STUDIO_ACTION_DESCRIPTORS.find(row=>row.id===current?.actionId)||null
  const setAction=(actionId:string)=>{const next=STUDIO_ACTION_DESCRIPTORS.find(row=>row.id===actionId);if(!next){onChange(null);return}onChange({version:1,actionId:next.id,target:null,newWindow:Boolean(next.defaultNewWindow)})}
  return <div className={styles.root}>
    <label className={styles.label}><span>{label}</span><select value={current?.actionId||''} onChange={event=>setAction(event.target.value)}><option value="">Aucune action</option>{STUDIO_ACTION_DESCRIPTORS.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
    {descriptor&&descriptor.targetSources.length?<UniversalSourcePickerField allowedSources={[...descriptor.targetSources]} sourceId={descriptor.targetSources.length===1?descriptor.targetSources[0]:undefined} mode="single" label="Cible canonique" description="Sélectionnez l’objet Marketplace réel. Aucun identifiant brut n’est nécessaire." value={current?.target||null} onChange={next=>onChange({...current!,target:Array.isArray(next)?next[0]||null:next})}/>:null}
    {descriptor?.executionMode==='external'?<label className={styles.label}><span>URL externe approuvée</span><input value={current?.externalUrl||''} placeholder="https://…" onChange={event=>onChange({...current!,externalUrl:event.target.value})}/>{current?.externalUrl&&!safeExternalStudioUrl(current.externalUrl)?<small data-tone="danger">Schéma URL refusé. HTTP(S), mailto et tel uniquement.</small>:null}</label>:null}
    {descriptor?<div className={styles.trust}><div><ShieldCheck size={17}/><strong>{descriptor.canonicalEngine}</strong></div><dl><div><dt>Conséquence</dt><dd>{descriptor.creates||'Navigation uniquement'}</dd></div><div><dt>Administration</dt><dd>{descriptor.adminDestination||'Aucun nouvel espace'}</dd></div><div><dt>Contrôles</dt><dd>{descriptor.validations.length?descriptor.validations.join(' · '):'Politique URL'}</dd></div></dl>{descriptor.p07WorkflowRequired?<p><Workflow size={15}/> Workflow reconnu et réservé au câblage formulaire P07 — aucune fausse soumission n’est simulée.</p>:null}{descriptor.adminDestination?<a href={descriptor.adminDestination} target="_blank" rel="noreferrer">Ouvrir l’espace existant <ExternalLink size={13}/></a>:null}</div>:null}
    {current&&isStudioActionReference(current)?<button className={styles.clear} type="button" onClick={()=>onChange(null)}>Retirer l’action</button>:null}
  </div>
}
