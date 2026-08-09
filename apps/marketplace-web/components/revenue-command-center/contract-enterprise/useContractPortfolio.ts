"use client"
import { useCallback, useEffect, useState } from "react"
import type { ContractContextType, ContractExperienceKey, ContractPortfolio } from "./types"

const EMPTY: ContractPortfolio = {
  contracts:[],handoffs:[],proposals:[],versions:[],sections:[],reviews:[],approvals:[],signatories:[],signatureEvents:[],signatureEvidence:[],conditions:[],conditionEvidence:[],obligations:[],obligationEvents:[],milestones:[],paymentTerms:[],paymentSchedules:[],paymentRequirements:[],paymentPromises:[],promiseEvents:[],collectionActions:[],financeHandoffs:[],paymentConfirmations:[],activationGates:[],activationDecisions:[],operationalHandoffs:[],realizationEvents:[],risks:[],statusHistory:[],closures:[],communications:[],tasks:[],
  summary:{total:0,preparation:0,review:0,approval:0,signaturePending:0,fullySigned:0,conditionsPending:0,paymentBlocked:0,activationReady:0,active:0,atRisk:0,expiring:0,contractValueMad:0,paymentPendingMad:0,paymentConfirmedMad:0,realizableMad:0,realizedMad:0,overdueObligations:0,brokenPromises:0},schema:{},syncedAt:"",
}

export function useContractPortfolio(experience:ContractExperienceKey,contextId?:string|null,contextType:ContractContextType="partnership"){
  const [data,setData]=useState<ContractPortfolio>(EMPTY)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const refresh=useCallback(async(silent=false,signal?:AbortSignal)=>{
    if(!silent)setLoading(true)
    setError(null)
    try{
      const search=new URLSearchParams({experience,contextType})
      if(contextId)search.set("contextId",contextId)
      const response=await fetch(`/api/revenue-command-center/contract/portfolio?${search.toString()}`,{cache:"no-store",signal})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok||payload?.ok===false)throw new Error(payload?.error||payload?.message||"Le portefeuille contractuel ne peut pas être chargé.")
      setData(payload?.data||payload||EMPTY)
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason))}
    finally{if(!silent)setLoading(false)}
  },[experience,contextId,contextType])
  useEffect(()=>{const controller=new AbortController();void refresh(false,controller.signal);return()=>controller.abort()},[refresh])
  return {data,loading,error,refresh}
}

export async function contractMutation(endpoint:string,body:Record<string,unknown>,method="POST"){
  const response=await fetch(endpoint,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})
  const payload=await response.json().catch(()=>({}))
  if(!response.ok||payload?.ok===false)throw new Error(payload?.error||payload?.message||"L’opération contractuelle a échoué.")
  return payload?.data||payload
}
