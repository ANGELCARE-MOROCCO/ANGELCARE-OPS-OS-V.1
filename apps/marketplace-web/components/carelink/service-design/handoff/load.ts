import{loadDashboard,getHandoff}from '@/lib/homeservice-handoff/server/repository'
export const handoffData=()=>loadDashboard()
export const handoffDetail=(id:string)=>getHandoff(id)
