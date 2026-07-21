import {NextRequest,NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError} from '@/lib/revenue-command-os/ai/api-access'
import {resolveRevenueAiProvider} from '@/lib/revenue-command-os/ai/provider-registry'
import {saveProviderHealth} from '@/lib/revenue-command-os/ai/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:NextRequest){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);if(!aiRights(user).read)return apiError('FORBIDDEN','Permission IA Revenue requise.',403);const live=new URL(request.url).searchParams.get('live')==='true';const health=await resolveRevenueAiProvider().checkHealth(live);await saveProviderHealth(health).catch(()=>undefined);return NextResponse.json({ok:true,data:health,mode:'shadow',externalActions:false},{headers:{'Cache-Control':'no-store'}})}
