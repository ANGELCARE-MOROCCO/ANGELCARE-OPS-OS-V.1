import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { studioError, studioRights, tenantOf } from '@/lib/revenue-command-os/strategy-studio/api-access'
import { listStudioStrategies } from '@/lib/revenue-command-os/strategy-studio/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){const user=await getCurrentUser();if(!user)return studioError('UNAUTHENTICATED','Authentification requise.',401);if(!studioRights(user).view)return studioError('FORBIDDEN','Permission Strategy Studio requise.',403);try{return NextResponse.json({ok:true,data:await listStudioStrategies(tenantOf(user)),mode:'shadow',externalActions:0})}catch(error){return studioError('STUDIO_LIST_FAILED',error instanceof Error?error.message:String(error),500)}}
