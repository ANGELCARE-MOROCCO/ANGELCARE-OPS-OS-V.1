import {NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError} from '@/lib/revenue-command-os/ai/api-access'
import {getRevenueAiModels} from '@/lib/revenue-command-os/ai/model-registry'
export const runtime='nodejs';export async function GET(){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);if(!aiRights(user).read)return apiError('FORBIDDEN','Permission IA Revenue requise.',403);return NextResponse.json({ok:true,data:getRevenueAiModels(),externalActions:false})}
