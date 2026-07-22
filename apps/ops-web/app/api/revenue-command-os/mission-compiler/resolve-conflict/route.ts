import { getCurrentUser } from '@/lib/getUser'
import { compilerError, compilerRights, tenantOf, actorOf } from '@/lib/revenue-command-os/mission-compiler/api-access'
import { conflictResolutionSchema } from '@/lib/revenue-command-os/mission-compiler/schemas'
import { resolveCompilationConflict } from '@/lib/revenue-command-os/mission-compiler/service'
import { NextResponse } from 'next/server'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return compilerError('UNAUTHENTICATED','Authentification requise.',401);if(!compilerRights(user).resolve)return compilerError('FORBIDDEN','Résolution de conflit interdite.',403);try{const parsed=conflictResolutionSchema.safeParse(await request.json());if(!parsed.success)return compilerError('INVALID_CONFLICT_RESOLUTION',parsed.error.message,422);const tenantId=tenantOf(user);return NextResponse.json({ok:true,data:await resolveCompilationConflict({...parsed.data,tenantId,actor:actorOf(user,tenantId)}),externalActions:0})}catch(error){return compilerError('CONFLICT_RESOLUTION_FAILED',error instanceof Error?error.message:String(error),500)}}
