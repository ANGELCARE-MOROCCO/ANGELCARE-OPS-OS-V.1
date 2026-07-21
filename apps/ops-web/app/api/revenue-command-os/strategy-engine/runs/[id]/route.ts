import {NextRequest,NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError,tenantOf} from '@/lib/revenue-command-os/ai/api-access'
import {getAiJob} from '@/lib/revenue-command-os/ai/repository'
export const runtime='nodejs';export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);if(!aiRights(user).read)return apiError('FORBIDDEN','Permission requise.',403);const {id}=await params;const job=await getAiJob(id,tenantOf(user));if(!job)return apiError('NOT_FOUND','Exécution introuvable.',404);return NextResponse.json({ok:true,data:job,externalActions:false})}
