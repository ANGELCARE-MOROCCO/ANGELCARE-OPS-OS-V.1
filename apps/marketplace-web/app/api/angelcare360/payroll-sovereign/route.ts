import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { NextRequest,NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { getPayrollSovereignSnapshot,payrollSovereignMutation } from '@/lib/angelcare360/server/payroll-sovereign-control'
export const runtime='nodejs';export const dynamic='force-dynamic'
function response(body:unknown,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
async function GET__customerPlatformImpl(req:NextRequest){try{return response({ok:true,snapshot:await getPayrollSovereignSnapshot({schoolId:req.nextUrl.searchParams.get('schoolId')})})}catch(e){if(e instanceof Angelcare360AccessError)return response({ok:false,error:e.message},e.status);return response({ok:false,error:e instanceof Error?e.message:'Erreur Paie.'},500)}}
async function POST__customerPlatformImpl(req:NextRequest){try{const p=await req.json().catch(()=>null);if(!p||typeof p!=='object')return response({ok:false,error:'Payload Paie invalide.'},422);const r=await payrollSovereignMutation(p as Record<string,unknown>);return response(r,r.ok?200:r.locked?409:422)}catch(e){if(e instanceof Angelcare360AccessError)return response({ok:false,error:e.message},e.status);return response({ok:false,error:e instanceof Error?e.message:'Erreur Paie.'},500)}}

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare360/payroll-sovereign' },
  GET__customerPlatformImpl,
)

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'mutation', operation: 'POST:/api/angelcare360/payroll-sovereign' },
  POST__customerPlatformImpl,
)
