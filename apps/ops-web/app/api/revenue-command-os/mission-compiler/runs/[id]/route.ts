import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { compilerError, compilerRights, tenantOf } from '@/lib/revenue-command-os/mission-compiler/api-access'
import { loadBlueprint } from '@/lib/revenue-command-os/mission-compiler/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const user=await getCurrentUser();if(!user)return compilerError('UNAUTHENTICATED','Authentification requise.',401);if(!compilerRights(user).view)return compilerError('FORBIDDEN','Permission compilateur requise.',403);try{const {id}=await params;return NextResponse.json({ok:true,data:await loadBlueprint(id,tenantOf(user)),mode:'shadow',externalActions:0})}catch(error){return compilerError('COMPILATION_RUN_FAILED',error instanceof Error?error.message:String(error),500)}}
