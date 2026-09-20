'use client'

import { Database, Link2, ShieldCheck, Trash2 } from 'lucide-react'
import { STUDIO_BINDING_MISSING_POLICIES, STUDIO_LIVE_BINDING_VERSION, type StudioLiveBindingMap, type StudioLiveBindingReference } from '../types'
import { STUDIO_LIVE_BINDINGS, studioBindingTarget, studioCompatibleBindings, normalizeStudioLiveBindingMap } from '../registry'
import styles from './studio-live-binding.module.css'

const POLICY_LABELS:Record<string,string>={preserve_static:'Conserver le contenu statique',empty:'Remplacer par vide',omit:'Omettre la propriété',hide_block:'Masquer le bloc'}

export function StudioLiveBindingField({targets,value,onChange}:{targets:string[];value:unknown;onChange:(value:StudioLiveBindingMap)=>void}){
  const current=normalizeStudioLiveBindingMap(value)
  const set=(target:string,reference:StudioLiveBindingReference|null)=>{const next={...current};if(reference)next[target]=reference;else delete next[target];onChange(next)}
  return <div className={styles.field}>
    <header><div><span><Database size={13}/> DONNÉES LIVE</span><strong>Bindings Marketplace</strong><p>Le template conserve uniquement l’instruction de binding. Les données métier restent dans leurs autorités canoniques.</p></div><ShieldCheck size={18}/></header>
    <div className={styles.targetList}>{targets.map(targetKey=>{const target=studioBindingTarget(targetKey);if(!target)return null;const reference=current[targetKey]||null;const options=studioCompatibleBindings(targetKey);const selected=reference?STUDIO_LIVE_BINDINGS.find(row=>row.key===reference.bindingKey)||null:null;return <article key={targetKey} className={styles.targetCard} data-active={Boolean(reference)}>
      <div className={styles.targetHead}><div><span>{target.label}</span><small>{target.accepts.join(' · ')}</small></div>{reference?<button type="button" onClick={()=>set(targetKey,null)} aria-label={`Retirer le binding ${target.label}`}><Trash2 size={13}/></button>:null}</div>
      <label><span>Source live</span><select value={reference?.bindingKey||''} onChange={event=>{const key=event.target.value;if(!key){set(targetKey,null);return}set(targetKey,{version:STUDIO_LIVE_BINDING_VERSION,bindingKey:key,missingPolicy:reference?.missingPolicy||'preserve_static'})}}><option value="">Contenu statique du template</option>{options.map(row=><option key={row.key} value={row.key}>{row.label}</option>)}</select></label>
      {reference?<><label><span>Si la donnée est absente</span><select value={reference.missingPolicy} onChange={event=>set(targetKey,{...reference,missingPolicy:event.target.value as StudioLiveBindingReference['missingPolicy']})}>{STUDIO_BINDING_MISSING_POLICIES.map(policy=><option key={policy} value={policy}>{POLICY_LABELS[policy]}</option>)}</select></label>{selected?<div className={styles.authority}><Link2 size={12}/><div><strong>{selected.authority}</strong><span>{selected.description}</span></div></div>:null}</>:null}
    </article>})}</div>
  </div>
}
