import {NextRequest,NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError} from '@/lib/revenue-command-os/ai/api-access'
export const runtime='nodejs';export async function POST(request:NextRequest){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);if(!aiRights(user).generate)return apiError('FORBIDDEN','Permission requise.',403);const body=await request.json();return NextResponse.json({ok:true,status:'retry_requires_objective_resubmission',runId:body.runId||null,externalActions:false},{status:202})}
