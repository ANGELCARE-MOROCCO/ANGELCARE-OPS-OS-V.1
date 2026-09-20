'use client'
import { ExternalLink,ShieldCheck,Workflow } from 'lucide-react'
import { UniversalSourcePickerField } from '@/angelcare-marketplace/studio-picker/components/UniversalSourcePicker'
import { STUDIO_WORKFLOW_DESCRIPTORS } from '../registry'
import type { StudioWorkflowReference } from '../types'
import styles from './studio-workflow.module.css'

export function StudioWorkflowField({value,onChange}:{value:StudioWorkflowReference|null|undefined;onChange:(value:StudioWorkflowReference|null)=>void}){
  const descriptor=STUDIO_WORKFLOW_DESCRIPTORS.find(row=>row.id===value?.workflowId)||null
  const choose=(workflowId:string)=>{const next=STUDIO_WORKFLOW_DESCRIPTORS.find(row=>row.id===workflowId);onChange(next?{version:1,workflowId:next.id,target:null}:null)}
  return <div className={styles.fieldRoot}>
    <label className={styles.adminLabel}><span>Workflow AngelCare</span><select value={value?.workflowId||''} onChange={event=>choose(event.target.value)}><option value="">Aucun workflow</option>{STUDIO_WORKFLOW_DESCRIPTORS.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
    {descriptor?.targetSources.length?<UniversalSourcePickerField allowedSources={[...descriptor.targetSources]} sourceId={descriptor.targetSources.length===1?descriptor.targetSources[0]:undefined} mode="single" label="Cible canonique" description="Sélectionnez l’offre réelle utilisée par ce workflow." value={value?.target||null} onChange={next=>onChange(value?{...value,target:Array.isArray(next)?next[0]||null:next}:null)}/>:null}
    {descriptor?<section className={styles.trust}><header><Workflow size={17}/><div><strong>{descriptor.label}</strong><span>{descriptor.execution}</span></div></header><p>{descriptor.description}</p><dl><div><dt>Autorité</dt><dd>{descriptor.canonicalEngine}</dd></div><div><dt>Crée</dt><dd>{descriptor.creates}</dd></div><div><dt>Champs publics</dt><dd>{descriptor.fields.length}</dd></div><div><dt>Consentements</dt><dd>{descriptor.consentKeys.length||'Compte existant'}</dd></div></dl><div className={styles.trustLine}><ShieldCheck size={16}/><span>{descriptor.authenticated?'Session utilisateur requise · échec contrôlé sinon':'Soumission publique gouvernée'}</span></div><a href={descriptor.adminDestination} target="_blank" rel="noreferrer">Ouvrir l’espace existant <ExternalLink size={13}/></a></section>:null}
    {value?<button className={styles.clear} type="button" onClick={()=>onChange(null)}>Retirer le workflow</button>:null}
  </div>
}
