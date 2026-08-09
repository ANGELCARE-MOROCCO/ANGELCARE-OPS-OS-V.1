"use client"

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArrowRight, Loader2, Pause, Play, Rocket, Send, X } from 'lucide-react'
import type { Territory, TerritoryStatus } from '../types'
import { TERRITORY_STATUS_TRANSITIONS } from '../constants'
import { TerritoryClientError, territoryRequest } from '../client-api'
import styles from '../territory-os.module.css'

const labels: Partial<Record<TerritoryStatus,string>> = {
  configuring: 'Reprendre la configuration',
  review: 'Soumettre à la revue',
  soft_launch: 'Autoriser le soft launch',
  live: 'Mettre en service',
  paused: 'Suspendre le territoire',
  archived: 'Archiver le territoire',
}
const icons: Partial<Record<TerritoryStatus,ReactNode>> = {
  configuring: <Play size={13}/>, review: <Send size={13}/>, soft_launch: <Rocket size={13}/>, live: <Rocket size={13}/>, paused: <Pause size={13}/>, archived: <Archive size={13}/>,
}

export function TerritoryTransitionActions({ territory, allowedTargets }: { territory: Territory; allowedTargets?: TerritoryStatus[] }) {
  const router = useRouter()
  const transitions = TERRITORY_STATUS_TRANSITIONS[territory.status].filter((status) => !allowedTargets || allowedTargets.includes(status))
  const [target,setTarget] = useState<TerritoryStatus|null>(null)
  const [reason,setReason] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState<string|null>(null)

  async function execute() {
    if (!target) return
    setBusy(true); setError(null)
    try {
      await territoryRequest<Territory>(`/api/angelcare-marketplace/territories/${territory.territory_code}/transition`, { method:'POST', body:JSON.stringify({targetStatus:target,reason,comments:reason}) })
      setTarget(null); setReason(''); router.refresh()
    } catch (cause) {
      setError(cause instanceof TerritoryClientError ? `${cause.message}${cause.requestId?` · Réf. ${cause.requestId}`:''}` : 'La transition a échoué.')
    } finally { setBusy(false) }
  }

  return <>
    {transitions.map((status)=><button key={status} type="button" className={status==='paused'||status==='archived'?styles.buttonDanger:styles.buttonSecondary} onClick={()=>{setTarget(status);setError(null)}}>{icons[status] || <ArrowRight size={13}/>} {labels[status] || status}</button>)}
    {target?<div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Confirmer la transition"><div className={styles.modal}>
      <header className={styles.modalHeader}><div><h3>{labels[target] || target}</h3><p>Cette action est validée côté serveur, contrôlée par permissions et enregistrée dans l’audit.</p></div><button className={styles.iconAction} onClick={()=>setTarget(null)} aria-label="Fermer"><X size={15}/></button></header>
      <div className={styles.modalBody}>{error?<div className={styles.noticeDanger} style={{marginBottom:14}}>{error}</div>:null}<label className={styles.formField}><span className={styles.formLabel}>Raison obligatoire</span><textarea className={styles.textarea} value={reason} onChange={(event)=>setReason(event.target.value)} placeholder="Expliquez la décision, les risques considérés et l’action suivante."/></label></div>
      <footer className={styles.modalFooter}><button className={styles.buttonSecondary} onClick={()=>setTarget(null)} disabled={busy}>Annuler</button><button className={target==='paused'||target==='archived'?styles.buttonDanger:styles.buttonPrimary} onClick={execute} disabled={busy||reason.trim().length<8}>{busy?<Loader2 size={13}/>:icons[target]} Confirmer</button></footer>
    </div></div>:null}
  </>
}
