import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { compilerError, compilerRights, tenantOf } from '@/lib/revenue-command-os/mission-compiler/api-access'
import { compareBlueprints } from '@/lib/revenue-command-os/mission-compiler/delta'
import { loadBlueprint } from '@/lib/revenue-command-os/mission-compiler/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){const user=await getCurrentUser();if(!user)return compilerError('UNAUTHENTICATED','Authentification requise.',401);if(!compilerRights(user).view)return compilerError('FORBIDDEN','Permission compilateur requise.',403);try{const url=new URL(request.url);const from=url.searchParams.get('from');const to=url.searchParams.get('to');if(!from||!to)return compilerError('INVALID_DELTA','from et to sont requis.',422);const tenantId=tenantOf(user);const delta=compareBlueprints(await loadBlueprint(from,tenantId),await loadBlueprint(to,tenantId));return NextResponse.json({ok:true,data:delta,externalActions:0})}catch(error){return compilerError('DELTA_FAILED',error instanceof Error?error.message:String(error),500)}}
