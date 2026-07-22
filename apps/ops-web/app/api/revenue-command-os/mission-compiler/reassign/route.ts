import { getCurrentUser } from '@/lib/getUser'
import { compilerError, compilerRights, tenantOf, actorOf } from '@/lib/revenue-command-os/mission-compiler/api-access'
import { reassignmentSchema } from '@/lib/revenue-command-os/mission-compiler/schemas'
import { reassignCompiledObject } from '@/lib/revenue-command-os/mission-compiler/service'
import { NextResponse } from 'next/server'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return compilerError('UNAUTHENTICATED','Authentification requise.',401);if(!compilerRights(user).resolve)return compilerError('FORBIDDEN','Réaffectation interdite.',403);try{const parsed=reassignmentSchema.safeParse(await request.json());if(!parsed.success)return compilerError('INVALID_REASSIGNMENT',parsed.error.message,422);const tenantId=tenantOf(user);return NextResponse.json({ok:true,data:await reassignCompiledObject({...parsed.data,tenantId,actor:actorOf(user,tenantId)}),externalActions:0})}catch(error){return compilerError('REASSIGNMENT_FAILED',error instanceof Error?error.message:String(error),500)}}
