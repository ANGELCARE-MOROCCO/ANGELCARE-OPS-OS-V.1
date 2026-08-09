"use client"

import { useCallback, useEffect, useState } from "react"
import type { PartnershipExperienceKey, PartnershipPortfolio } from "./types"

const EMPTY: PartnershipPortfolio = {
  partnerships:[],stakeholders:[],qualifications:[],programs:[],programLocations:[],programServices:[],benefits:[],benefitUsage:[],obligations:[],milestones:[],activationPlans:[],activationGates:[],referrals:[],referralHistory:[],attributions:[],attributionConflicts:[],performancePeriods:[],performanceMetrics:[],scorecards:[],reviews:[],risks:[],recoveryPlans:[],recoveryCheckpoints:[],renewals:[],expansions:[],statusHistory:[],closures:[],contracts:[],realizationEvents:[],tasks:[],communications:[],meetings:[],
  summary:{total:0,qualifying:0,active:0,performing:0,atRisk:0,recovery:0,renewalDue:0,expansionReady:0,referralCount:0,acceptedReferrals:0,attributedReferrals:0,openConflicts:0,openObligations:0,overdueObligations:0,openRisks:0,pipelineMad:0,contractedMad:0,realizedMad:0,averageHealth:0},
  schema:{},syncedAt:"",
}

export function usePartnershipPortfolio(experience:PartnershipExperienceKey,contextId?:string|null){
  const [data,setData]=useState<PartnershipPortfolio>(EMPTY)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const refresh=useCallback(async(silent=false,signal?:AbortSignal)=>{
    if(!silent)setLoading(true)
    setError(null)
    try{
      const search=new URLSearchParams({experience})
      if(contextId)search.set("contextId",contextId)
      const response=await fetch(`/api/revenue-command-center/partnership/portfolio?${search.toString()}`,{cache:"no-store",signal})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok||payload?.ok===false)throw new Error(payload?.error||payload?.message||"Le portefeuille partenarial ne peut pas être chargé.")
      setData(payload?.data||payload||EMPTY)
    }catch(reason){
      if((reason as any)?.name!=="AbortError")setError(reason instanceof Error?reason.message:String(reason))
    }finally{if(!silent)setLoading(false)}
  },[experience,contextId])
  useEffect(()=>{const controller=new AbortController();void refresh(false,controller.signal);return()=>controller.abort()},[refresh])
  return {data,loading,error,refresh}
}

export async function partnershipMutation(endpoint:string,body:Record<string,unknown>,method="POST"){
  const response=await fetch(endpoint,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})
  const payload=await response.json().catch(()=>({}))
  if(!response.ok||payload?.ok===false)throw new Error(payload?.error||payload?.message||"L’opération partenariale a échoué.")
  return payload?.data||payload
}
