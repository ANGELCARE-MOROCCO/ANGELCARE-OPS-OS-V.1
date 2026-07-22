import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { compilerError, compilerRights, tenantOf } from '@/lib/revenue-command-os/mission-compiler/api-access'
import { listEligibleStrategies } from '@/lib/revenue-command-os/mission-compiler/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){const user=await getCurrentUser();if(!user)return compilerError('UNAUTHENTICATED','Authentification requise.',401);if(!compilerRights(user).view)return compilerError('FORBIDDEN','Permission compilateur requise.',403);try{return NextResponse.json({ok:true,data:await listEligibleStrategies(tenantOf(user)),mode:'shadow',externalActions:0})}catch(error){return compilerError('ELIGIBLE_STRATEGIES_FAILED',error instanceof Error?error.message:String(error),500)}}
