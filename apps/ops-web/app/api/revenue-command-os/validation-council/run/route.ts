import crypto from 'node:crypto'
import {NextRequest,NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {councilError,councilRights,tenantOf} from '@/lib/revenue-command-os/validation-council/api-access'
import {runValidationCouncil} from '@/lib/revenue-command-os/validation-council/orchestrator'
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=300
export async function POST(request:NextRequest){const user=await getCurrentUser();if(!user)return councilError('UNAUTHENTICATED','Authentification requise.',401);if(!councilRights(user).run)return councilError('FORBIDDEN','Permission Conseil MZ11 requise.',403);try{const body=await request.json();const tenantId=tenantOf(user,body);const data=await runValidationCouncil({tenantId,userId:String(user.id||user.email||'current-user'),strategyId:body.strategyId,strategy:body.strategy,context:body.context,idempotencyKey:request.headers.get('idempotency-key')||body.idempotencyKey||crypto.randomUUID()});return NextResponse.json({ok:true,data,mode:'shadow',externalActions:0},{status:201})}catch(error){return councilError('COUNCIL_RUN_FAILED',error instanceof Error?error.message:String(error),500)}}
