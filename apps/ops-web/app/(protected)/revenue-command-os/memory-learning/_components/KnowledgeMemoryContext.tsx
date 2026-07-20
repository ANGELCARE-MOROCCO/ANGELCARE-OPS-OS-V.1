'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type {
  RevenueDoctrineMutationInput,
  RevenueKnowledgeApprovalDecision,
  RevenueKnowledgeBootstrap,
  RevenueKnowledgeConflictStatus,
  RevenueKnowledgeValidationIssue,
} from '@/lib/revenue-command-os/types'

type ContextValue = {
  knowledge: RevenueKnowledgeBootstrap
  busy: boolean
  error: string
  refresh: () => Promise<void>
  mutateDoctrine: (input: RevenueDoctrineMutationInput) => Promise<void>
  decideApproval: (id: string, decision: RevenueKnowledgeApprovalDecision, rationale: string) => Promise<void>
  resolveConflict: (id: string, status: RevenueKnowledgeConflictStatus, resolution: string) => Promise<void>
  queueIndex: (assetId: string) => Promise<void>
  runValidation: () => Promise<void>
  updateValidationStatus: (id: string, status: RevenueKnowledgeValidationIssue['status']) => Promise<void>
}

const KnowledgeMemoryContext=createContext<ContextValue | null>(null)

export function KnowledgeMemoryProvider({ initialKnowledge, children }: { initialKnowledge: RevenueKnowledgeBootstrap; children: React.ReactNode }) {
  const [knowledge,setKnowledge]=useState(initialKnowledge)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const call=useCallback(async(action:string,payload?:unknown)=>{
    setBusy(true); setError('')
    try {
      const response=await fetch('/api/revenue-command-os/knowledge-memory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload})})
      const json=await response.json(); if(!response.ok || !json.ok) throw new Error(json?.error?.message || 'Action impossible.')
      const refresh=await fetch('/api/revenue-command-os/knowledge-memory',{cache:'no-store'}); const refreshed=await refresh.json(); if(!refresh.ok || !refreshed.ok) throw new Error(refreshed?.error?.message || 'Actualisation impossible.')
      setKnowledge(refreshed.data)
      return json.data
    } catch(e) { setError(e instanceof Error?e.message:'Erreur Doctrine & mémoire.'); throw e }
    finally { setBusy(false) }
  },[])
  const refresh=useCallback(async()=>{
    setBusy(true);setError('')
    try { const response=await fetch('/api/revenue-command-os/knowledge-memory',{cache:'no-store'});const json=await response.json();if(!response.ok||!json.ok)throw new Error(json?.error?.message||'Actualisation impossible.');setKnowledge(json.data) }
    catch(e){setError(e instanceof Error?e.message:'Actualisation impossible.')}
    finally{setBusy(false)}
  },[])
  const value=useMemo<ContextValue>(()=>({knowledge,busy,error,refresh,
    mutateDoctrine:async(input)=>{await call('mutate_doctrine',{operation:input.operation,id:input.id,data:input.payload})},
    decideApproval:async(id,decision,rationale)=>{await call('decide_approval',{id,decision,rationale})},
    resolveConflict:async(id,status,resolution)=>{await call('resolve_conflict',{id,status,resolution})},
    queueIndex:async(assetId)=>{await call('queue_index',{assetId})},
    runValidation:async()=>{await call('run_validation')},
    updateValidationStatus:async(id,status)=>{await call('update_validation_status',{id,status})},
  }),[knowledge,busy,error,refresh,call])
  return <KnowledgeMemoryContext.Provider value={value}>{children}</KnowledgeMemoryContext.Provider>
}

export function useKnowledgeMemory(){const value=useContext(KnowledgeMemoryContext);if(!value)throw new Error('KnowledgeMemoryProvider manquant.');return value}
