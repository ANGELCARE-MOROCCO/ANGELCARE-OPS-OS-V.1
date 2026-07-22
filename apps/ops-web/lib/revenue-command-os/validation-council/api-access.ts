import {NextResponse} from 'next/server'
import {aiRights,tenantOf} from '../ai/api-access'
export function councilRights(user:any){const ai=aiRights(user);const p=new Set(Array.isArray(user?.permissions)?user.permissions.map(String):[]);return{read:ai.read||p.has('revenue_os.council.view'),run:ai.generate||p.has('revenue_os.council.run'),manage:ai.manage||p.has('revenue_os.council.manage')}}
export {tenantOf}
export const councilError=(code:string,message:string,status=400)=>NextResponse.json({ok:false,error:{code,message}},{status})
