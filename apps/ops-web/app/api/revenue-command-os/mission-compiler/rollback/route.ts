import { getCurrentUser } from '@/lib/getUser'
import { compilerError, compilerRights, tenantOf, actorOf } from '@/lib/revenue-command-os/mission-compiler/api-access'
import { rollbackSchema } from '@/lib/revenue-command-os/mission-compiler/schemas'
import { rollbackCompilation } from '@/lib/revenue-command-os/mission-compiler/service'
import { NextResponse } from 'next/server'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return compilerError('UNAUTHENTICATED','Authentification requise.',401);if(!compilerRights(user).rollback)return compilerError('FORBIDDEN','Rollback interdit.',403);try{const parsed=rollbackSchema.safeParse(await request.json());if(!parsed.success)return compilerError('INVALID_ROLLBACK',parsed.error.message,422);const tenantId=tenantOf(user);return NextResponse.json({ok:true,data:await rollbackCompilation({...parsed.data,tenantId,actor:actorOf(user,tenantId)}),externalActions:0})}catch(error){return compilerError('ROLLBACK_FAILED',error instanceof Error?error.message:String(error),500)}}
