"use client"

import { useCallback, useEffect, useState } from "react"
import type { B2CPortfolio } from "./types"

type LoadState = {
  data: B2CPortfolio | null
  loading: boolean
  error: string | null
}

export function useB2CPortfolio(caseId?:string|null){
  const [state,setState]=useState<LoadState>({data:null,loading:true,error:null})
  const load=useCallback(async()=>{
    setState(current=>({...current,loading:true,error:null}))
    try{
      const query=caseId?`?caseId=${encodeURIComponent(caseId)}`:""
      const response=await fetch(`/api/revenue-command-center/b2c-enterprise/portfolio${query}`,{cache:"no-store"})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok||payload?.ok===false)throw new Error(payload?.error||"Impossible de charger le portefeuille B2C.")
      setState({data:payload?.data||payload,loading:false,error:null})
    }catch(error){
      setState(current=>({...current,loading:false,error:error instanceof Error?error.message:String(error)}))
    }
  },[caseId])
  useEffect(()=>{void load()},[load])
  return {...state,refresh:load}
}

export async function b2cMutation(endpoint:string,method:string,body:Record<string,unknown>){
  const response=await fetch(endpoint,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
  const payload=await response.json().catch(()=>({}))
  if(!response.ok||payload?.ok===false)throw new Error(payload?.error||"L’opération B2C a échoué.")
  return payload?.data||payload
}
