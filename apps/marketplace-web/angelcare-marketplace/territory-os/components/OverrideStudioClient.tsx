"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, Plus, RotateCcw, ShieldAlert, X, XCircle } from 'lucide-react'
import type { Territory, TerritoryOverride, TerritorySetting } from '../types'
import { TerritoryClientError, territoryRequest } from '../client-api'
import styles from '../territory-os.module.css'
import { CommandPanel, TerritoryEmpty } from './TerritoryPrimitives'

interface Props {
  territory: Territory
  settings: TerritorySetting[]
  overrides: TerritoryOverride[]
  canCreate: boolean
  canApprove: boolean
  canReject: boolean
  canRollback: boolean
}

type Action = 'create' | 'approve' | 'reject' | 'rollback'

export function OverrideStudioClient({ territory, settings, overrides, canCreate, canApprove, canReject, canRollback }: Props) {
  const router = useRouter()
  const eligible = useMemo(() => settings.filter((setting) => setting.local_override_allowed && !setting.is_locked), [settings])
  const [action,setAction] = useState<Action|null>(null)
  const [selected,setSelected] = useState<TerritoryOverride|null>(null)
  const [settingKey,setSettingKey] = useState(eligible[0]?.setting_key || '')
  const [proposedValue,setProposedValue] = useState('')
  const [riskLevel,setRiskLevel] = useState('medium')
  const [reason,setReason] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState<string|null>(null)

  function open(next:Action, item?:TerritoryOverride) { setAction(next);setSelected(item||null);setReason('');setError(null); if(next==='create'){setProposedValue('');setRiskLevel('medium')} }
  function close(){if(!busy){setAction(null);setSelected(null)}}
  async function execute(){if(!action)return;setBusy(true);setError(null);try{
    if(action==='create'){
      let parsed:unknown=proposedValue;try{parsed=JSON.parse(proposedValue)}catch{parsed=proposedValue}
      await territoryRequest<TerritoryOverride>(`/api/angelcare-marketplace/territories/${territory.territory_code}/overrides`,{method:'POST',body:JSON.stringify({settingKey,proposedValue:parsed,businessReason:reason,riskLevel})})
    } else if(selected) {
      const url = action==='rollback' ? `/api/angelcare-marketplace/territory-overrides/${selected.id}/rollback` : `/api/angelcare-marketplace/territory-overrides/${selected.id}/review`
      const body = action==='rollback' ? {reason} : {decision:action==='approve'?'approve':'reject',reason}
      await territoryRequest<TerritoryOverride>(url,{method:'POST',body:JSON.stringify(body)})
    }
    setAction(null);setSelected(null);router.refresh()
  }catch(cause){setError(cause instanceof TerritoryClientError?`${cause.message}${cause.requestId?` · Réf. ${cause.requestId}`:''}`:'L’action de gouvernance a échoué.')}finally{setBusy(false)}}

  return <div className={styles.territoryCommand}>
    <section className={styles.commandHero} style={{minHeight:230}}><div className={styles.heroCopy}><span className={styles.heroKicker}>Inheritance & Override Studio</span><h1 className={styles.heroTitle} style={{fontSize:'clamp(31px,3.5vw,48px)'}}>Standards globaux.<br/>Adaptation locale sous contrôle.</h1><p className={styles.heroLead}>Chaque différence affiche sa source, sa version, son risque, son propriétaire, son reviewer et sa capacité de rollback. Aucun override silencieux n’est accepté.</p><div className={styles.heroActions}>{canCreate?<button className={styles.heroPrimary} onClick={()=>open('create')}><Plus size={14}/> Proposer un override</button>:null}</div></div><div className={styles.heroControl}><div className={styles.heroControlHeader}><span>Contrôle des différences</span><span className={styles.heroPulse}/></div><div className={styles.heroControlValue}>{overrides.filter((item)=>['submitted','in_review'].includes(item.status)).length}</div><div className={styles.heroControlLabel}>Dérogation(s) en attente d’une décision explicite.</div><div className={styles.heroControlDivider}/><div className={styles.heroControlRow}><span>Standards hérités</span><strong>{settings.filter((item)=>item.inheritance_mode.includes('inherited')).length}</strong></div><div className={styles.heroControlRow}><span>Standards verrouillés</span><strong>{settings.filter((item)=>item.is_locked).length}</strong></div><div className={styles.heroControlRow}><span>Overrides effectifs</span><strong>{overrides.filter((item)=>item.status==='effective').length}</strong></div></div></section>

    <CommandPanel title="Matrice d’héritage" subtitle="Valeurs effectives, mode d’héritage et droit de dérogation." flush><div className={styles.settingList}>{settings.map((setting)=><div className={styles.settingRow} key={setting.id}><span className={styles.settingLabel}><strong>{setting.label}</strong><span>{setting.category} · source v{setting.source_version||1}</span></span><span className={styles.settingValue}>{renderValue(setting.effective_value)}</span><span className={`${styles.inheritanceBadge} ${setting.is_locked?styles.lockedGlobal:setting.inheritance_mode==='local_override'?styles.localOverride:setting.override_status==='submitted'?styles.pendingApproval:styles.inherited}`}>{setting.is_locked?'LOCKED GLOBAL':setting.override_status==='submitted'?'PENDING APPROVAL':setting.inheritance_mode==='local_override'?'LOCAL OVERRIDE':'INHERITED'}</span></div>)}</div></CommandPanel>

    <CommandPanel title="Dossiers de dérogation" subtitle="Diffs, justification, décision et retour arrière.">
      {overrides.length?<div className={styles.overrideList}>{overrides.map((item)=><article className={styles.overrideCard} key={item.id}><header className={styles.overrideHeader}><div><strong>{item.setting_key}</strong><span>{item.public_reference} · risque {item.risk_level} · v{item.version}</span></div><span className={`${styles.inheritanceBadge} ${item.status==='effective'?styles.localOverride:item.status==='submitted'||item.status==='in_review'?styles.pendingApproval:item.status==='rejected'||item.status==='rolled_back'?styles.lockedGlobal:styles.inherited}`}>{item.status.replace('_',' ').toUpperCase()}</span></header><div className={styles.diffGrid}><div className={styles.diffSide}><span className={styles.diffSideLabel}>Standard source</span><div className={styles.diffValue}>{renderValue(item.source_value)}</div></div><span className={styles.diffArrow}><ArrowRight size={17}/></span><div className={styles.diffSide}><span className={styles.diffSideLabel}>Proposition locale</span><div className={styles.diffValue}>{renderValue(item.proposed_value)}</div></div></div><footer className={styles.overrideFooter}><span className={styles.overrideReason}>{item.business_reason}{item.decision_reason?` · Décision : ${item.decision_reason}`:''}</span><span className={styles.overrideActions}>{['submitted','in_review'].includes(item.status)&&canApprove?<button className={styles.buttonPrimary} onClick={()=>open('approve',item)}><CheckCircle2 size={13}/> Approuver</button>:null}{['submitted','in_review'].includes(item.status)&&canReject?<button className={styles.buttonDanger} onClick={()=>open('reject',item)}><XCircle size={13}/> Rejeter</button>:null}{item.status==='effective'&&canRollback?<button className={styles.buttonSecondary} onClick={()=>open('rollback',item)}><RotateCcw size={13}/> Rollback</button>:null}</span></footer></article>)}</div>:<TerritoryEmpty title="Aucune dérogation enregistrée" text="Le territoire utilise actuellement ses standards hérités ou locaux sans dossier de différence. Une dérogation ne doit être créée que lorsqu’une variation métier réelle est nécessaire." />}
    </CommandPanel>

    {action?<div className={styles.modalBackdrop}><div className={styles.modal}><header className={styles.modalHeader}><div><h3>{action==='create'?'Proposer un override':action==='approve'?'Approuver la dérogation':action==='reject'?'Rejeter la dérogation':'Restaurer le standard source'}</h3><p>{action==='create'?'La proposition reste non effective jusqu’à la décision autorisée.':'La décision écrira l’audit, la review et la valeur effective lorsque applicable.'}</p></div><button className={styles.iconAction} onClick={close}><X size={14}/></button></header><div className={styles.modalBody}>{error?<div className={styles.noticeDanger} style={{marginBottom:14}}><ShieldAlert size={16}/><span>{error}</span></div>:null}{action==='create'?<><label className={styles.formField}><span className={styles.formLabel}>Standard concerné</span><select className={styles.select} value={settingKey} onChange={(event)=>setSettingKey(event.target.value)}>{eligible.map((setting)=><option key={setting.id} value={setting.setting_key}>{setting.label} · {setting.category}</option>)}</select></label><label className={styles.formField} style={{marginTop:13}}><span className={styles.formLabel}>Valeur proposée</span><textarea className={styles.textarea} value={proposedValue} onChange={(event)=>setProposedValue(event.target.value)} placeholder="Texte ou JSON structuré"/></label><label className={styles.formField} style={{marginTop:13}}><span className={styles.formLabel}>Niveau de risque</span><select className={styles.select} value={riskLevel} onChange={(event)=>setRiskLevel(event.target.value)}><option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Élevé</option><option value="critical">Critique</option></select></label></>:null}<label className={styles.formField} style={{marginTop:13}}><span className={styles.formLabel}>{action==='create'?'Justification métier':'Commentaire de décision'}</span><textarea className={styles.textarea} value={reason} onChange={(event)=>setReason(event.target.value)} placeholder="Expliquez le besoin, l’impact, les risques et le chemin correctif."/></label></div><footer className={styles.modalFooter}><button className={styles.buttonSecondary} onClick={close}>Annuler</button><button className={action==='reject'||action==='rollback'?styles.buttonDanger:styles.buttonPrimary} disabled={busy||reason.trim().length<10||(action==='create'&&(!settingKey||!proposedValue.trim()))} onClick={execute}>{busy?<Loader2 size={13}/>:action==='rollback'?<RotateCcw size={13}/>:<CheckCircle2 size={13}/>} Confirmer</button></footer></div></div>:null}
  </div>
}
function renderValue(value:unknown){if(value==null)return 'Non renseigné';if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value);return JSON.stringify(value,null,2)}
