import {NextRequest,NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError,tenantOf} from '@/lib/revenue-command-os/ai/api-access'
import {cancelAiJob} from '@/lib/revenue-command-os/ai/repository'
export const runtime='nodejs';export async function POST(request:NextRequest){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);if(!aiRights(user).manage)return apiError('FORBIDDEN','Permission de gestion IA requise.',403);const body=await request.json();if(!body.id)return apiError('ID_REQUIRED','Identifiant requis.',400);await cancelAiJob(String(body.id),tenantOf(user,body));return NextResponse.json({ok:true,status:'cancelled',externalActions:false})}
