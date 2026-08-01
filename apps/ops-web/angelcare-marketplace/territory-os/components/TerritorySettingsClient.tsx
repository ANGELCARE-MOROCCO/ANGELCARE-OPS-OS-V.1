"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, Loader2, LockKeyhole, Save, X } from 'lucide-react'
import type { Territory, TerritorySetting } from '../types'
import { TerritoryClientError, territoryRequest } from '../client-api'
import styles from '../territory-os.module.css'
import { CommandPanel } from './TerritoryPrimitives'

export function TerritorySettingsClient({ territory, settings, canManage }: { territory: Territory; settings: TerritorySetting[]; canManage: boolean }) {
  const router = useRouter()
  const [editing,setEditing] = useState<TerritorySetting|null>(null)
  const [value,setValue] = useState('')
  const [reason,setReason] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState<string|null>(null)
  const groups = [...new Set(settings.map((setting)=>setting.category))]
  function open(setting:TerritorySetting){setEditing(setting);setValue(formatEditable(setting.effective_value));setReason('');setError(null)}
  async function save(){ if(!editing)return; setBusy(true);setError(null);try{let parsed:unknown=value;try{parsed=JSON.parse(value)}catch{parsed=value}await territoryRequest<TerritorySetting>(`/api/angelcare-marketplace/territories/${territory.territory_code}/settings/${encodeURIComponent(editing.setting_key)}`,{method:'PATCH',body:JSON.stringify({value:parsed,reason})});setEditing(null);router.refresh()}catch(cause){setError(cause instanceof TerritoryClientError?cause.message:'La mise à jour a échoué.')}finally{setBusy(false)} }
  return <div className={styles.territoryCommand}>
    <div className={styles.noticeInfo}><LockKeyhole size={16}/><span>Les standards verrouillés ne sont jamais modifiables ici. Une variation autorisée passe par un paramètre local ou le studio de dérogation avec revue et rollback.</span></div>
    {groups.map((group)=><CommandPanel key={group} title={group} subtitle={`${settings.filter((setting)=>setting.category===group).length} standard(s) territorial(aux)`} flush><div className={styles.settingList}>{settings.filter((setting)=>setting.category===group).map((setting)=><div className={styles.settingRow} key={setting.id}><span className={styles.settingLabel}><strong>{setting.label}</strong><span>{setting.setting_key}</span></span><span className={styles.settingValue}>{display(setting.effective_value)}</span><span style={{display:'flex',alignItems:'center',gap:8}}><span className={`${styles.inheritanceBadge} ${setting.is_locked?styles.lockedGlobal:setting.inheritance_mode==='local_override'?styles.localOverride:styles.inherited}`}>{setting.is_locked?'Global verrouillé':setting.inheritance_mode==='local_override'?'Override local':'Hérité'}</span>{canManage&&!setting.is_locked&&setting.local_override_allowed?<button className={styles.iconAction} onClick={()=>open(setting)} aria-label={`Modifier ${setting.label}`}><Edit3 size={13}/></button>:null}</span></div>)}</div></CommandPanel>)}
    {editing?<div className={styles.modalBackdrop}><div className={styles.modal}><header className={styles.modalHeader}><div><h3>Modifier {editing.label}</h3><p>{editing.description || editing.setting_key}</p></div><button className={styles.iconAction} onClick={()=>setEditing(null)}><X size={14}/></button></header><div className={styles.modalBody}>{error?<div className={styles.noticeDanger} style={{marginBottom:13}}>{error}</div>:null}<label className={styles.formField}><span className={styles.formLabel}>Valeur effective</span><textarea className={styles.textarea} value={value} onChange={(event)=>setValue(event.target.value)}/><p className={styles.formHelp}>Texte simple ou JSON valide selon le standard.</p></label><label className={styles.formField} style={{marginTop:14}}><span className={styles.formLabel}>Raison obligatoire</span><textarea className={styles.textarea} value={reason} onChange={(event)=>setReason(event.target.value)} placeholder="Justifiez la variation locale et son impact."/></label></div><footer className={styles.modalFooter}><button className={styles.buttonSecondary} onClick={()=>setEditing(null)}>Annuler</button><button className={styles.buttonPrimary} disabled={busy||reason.trim().length<8} onClick={save}>{busy?<Loader2 size={13}/>:<Save size={13}/>} Enregistrer avec audit</button></footer></div></div>:null}
  </div>
}
function display(value:unknown){if(value==null)return 'Non renseigné';if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value);return JSON.stringify(value)}
function formatEditable(value:unknown){if(typeof value==='string')return value;return JSON.stringify(value,null,2)}
