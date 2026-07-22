import { getCurrentUser } from '@/lib/getUser'
import { compilerError, compilerRights, tenantOf, actorOf } from '@/lib/revenue-command-os/mission-compiler/api-access'
import { preparePropagationSchema } from '@/lib/revenue-command-os/mission-compiler/schemas'
import { prepareForPropagation } from '@/lib/revenue-command-os/mission-compiler/service'
import { NextResponse } from 'next/server'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return compilerError('UNAUTHENTICATED','Authentification requise.',401);if(!compilerRights(user).prepare)return compilerError('FORBIDDEN','Préparation MZ14 interdite.',403);try{const parsed=preparePropagationSchema.safeParse(await request.json());if(!parsed.success)return compilerError('INVALID_PROPAGATION_PREP',parsed.error.message,422);const tenantId=tenantOf(user);return NextResponse.json({ok:true,data:await prepareForPropagation({tenantId,runId:parsed.data.runId,reason:parsed.data.reason,actor:actorOf(user,tenantId)}),mode:'shadow',externalActions:0})}catch(error){return compilerError('PROPAGATION_PREP_FAILED',error instanceof Error?error.message:String(error),500)}}
