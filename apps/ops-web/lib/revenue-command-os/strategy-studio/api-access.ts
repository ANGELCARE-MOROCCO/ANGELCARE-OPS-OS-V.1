import { NextResponse } from 'next/server'
import type { ApprovalClass, StudioActor } from './types'

const set=(v:unknown)=>new Set(Array.isArray(v)?v.map(String):[])
export function studioRights(user:any){
  const role=String(user?.role||user?.role_key||'').toLowerCase()
  const permissions=set(user?.permissions)
  const all=['ceo','direction','admin','managing_director'].includes(role)||permissions.has('*')
  return {
    view:all||permissions.has('revenue_os.strategy_studio.view')||permissions.has('revenue_os.strategy.view'),
    review:all||permissions.has('revenue_os.strategy_studio.review'),
    approve:all||permissions.has('revenue_os.strategy_studio.approve'),
    approveFinancial:all||permissions.has('revenue_os.strategy_studio.approve_financial'),
    approveCapacity:all||permissions.has('revenue_os.strategy_studio.approve_capacity'),
    manageClass:all||permissions.has('revenue_os.strategy_studio.manage_approval_class'),
    exportMemo:all||permissions.has('revenue_os.strategy_studio.export_memo'),
    manage:all||permissions.has('revenue_os.strategy_studio.manage'),
  }
}
export function canApproveClass(user:any,approvalClass:ApprovalClass){
  const r=studioRights(user)
  if(!r.approve)return false
  if(approvalClass==='financial'||approvalClass==='high_risk_exception')return r.approveFinancial
  if(approvalClass==='capacity')return r.approveCapacity
  return true
}
export const tenantOf=(user:any,payload?:any)=>String(payload?.tenantId||user?.tenant_id||user?.tenantId||user?.organization_id||'angelcare')
export const actorOf=(user:any):StudioActor=>({id:String(user?.id||user?.email||'current-user'),displayName:String(user?.full_name||user?.name||user?.email||'Direction'),role:String(user?.role||user?.role_key||'direction'),permissions:Array.isArray(user?.permissions)?user.permissions.map(String):[]})
export const studioError=(code:string,message:string,status=400)=>NextResponse.json({ok:false,error:{code,message}},{status})
