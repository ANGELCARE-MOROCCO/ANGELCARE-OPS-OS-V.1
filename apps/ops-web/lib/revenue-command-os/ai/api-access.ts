import {NextResponse} from 'next/server'
export function aiRights(user:any){const role=String(user?.role||user?.role_key||'').toLowerCase();const p=new Set(Array.isArray(user?.permissions)?user.permissions.map(String):[]);const all=['ceo','direction','admin'].includes(role)||p.has('*');return{read:all||p.has('revenue_os.view')||p.has('revenue_os.ai.view')||p.has('revenue_os.strategy.view'),generate:all||p.has('revenue_os.ai.generate')||p.has('revenue_os.strategy.manage'),manage:all||p.has('revenue_os.ai.manage')}}
export const apiError=(code:string,message:string,status=400)=>NextResponse.json({ok:false,error:{code,message}},{status})
export const tenantOf=(user:any,payload?:any)=>String(payload?.tenantId||user?.tenant_id||user?.tenantId||user?.organization_id||'angelcare')
