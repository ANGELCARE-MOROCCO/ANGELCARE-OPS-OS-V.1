"use client"
import { useCallback, useEffect, useState } from "react"
import type { ProposalPortfolio } from "./types"

const EMPTY: ProposalPortfolio = {
  proposals:[], opportunities:[], versions:[], sections:[], lineItems:[], pricingScenarios:[], approvals:[], discountRequests:[], marginExceptions:[], recipients:[], transmissions:[], deliveryEvents:[], responses:[], negotiations:[], rounds:[], positions:[], objections:[], counteroffers:[], concessions:[], decisions:[], statusHistory:[], contractHandoffs:[], communications:[], tasks:[],
  summary:{total:0,draft:0,approvalRequired:0,approved:0,readyToSend:0,sent:0,customerReview:0,negotiation:0,accepted:0,rejected:0,expiring:0,valueMad:0,weightedValueMad:0,valueAtRiskMad:0,averageMarginPercent:0,discountExposureMad:0,pendingConcessions:0,openObjections:0,stalledNegotiations:0,contractReady:0},
  schema:{}, syncedAt:new Date(0).toISOString(),
}

export function useProposalPortfolio(experience:string, contextId?:string|null, contextType?:string|null) {
  const [data,setData]=useState<ProposalPortfolio>(EMPTY)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const refresh=useCallback(async()=>{
    setLoading(true);setError(null)
    try{
      const params=new URLSearchParams({experience})
      if(contextId)params.set("contextId",contextId)
      if(contextType)params.set("contextType",contextType)
      const response=await fetch(`/api/revenue-command-center/proposal/portfolio?${params.toString()}`,{cache:"no-store"})
      const body=await response.json().catch(()=>({}))
      if(!response.ok||!body.ok)throw new Error(body.error||"Impossible de charger le portefeuille des offres.")
      setData(body as ProposalPortfolio)
    }catch(cause){setError(cause instanceof Error?cause.message:"Erreur de chargement")}
    finally{setLoading(false)}
  },[experience,contextId,contextType])
  useEffect(()=>{void refresh()},[refresh])
  return {data,loading,error,refresh}
}

export async function proposalMutation(path:string,input:Record<string,unknown>,method="POST"){
  const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(input)})
  const body=await response.json().catch(()=>({}))
  if(!response.ok||!body.ok)throw new Error(body.error||"L’opération commerciale n’a pas pu être exécutée.")
  return body
}
