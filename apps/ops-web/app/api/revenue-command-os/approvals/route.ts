import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { readApprovalDesk } from '@/lib/revenue-command-os/approvals/repository'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse } from '@/lib/revenue-command-os/http'
import { tenantOf } from '@/lib/revenue-command-os/strategy-studio/api-access'
export const runtime='nodejs'; export const dynamic='force-dynamic'
export async function GET(){
  const user=await getCurrentUser()
  if(!user)return revenueOsErrorResponse(new RevenueOsError('UNAUTHENTICATED','Authentification requise.',{status:401}))
  try{return NextResponse.json(await readApprovalDesk(tenantOf(user)))}catch(error){return revenueOsErrorResponse(error instanceof RevenueOsError?error:new RevenueOsError('DECISION_DESK_LOAD_FAILED','Le centre de décision directe ne peut pas être chargé.',{status:500,recoverable:true,cause:error}))}
}
