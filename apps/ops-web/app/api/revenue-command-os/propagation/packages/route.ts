import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { executionError, executionRights, tenantOf } from '@/lib/revenue-command-os/execution-autopilot/api-access'
import { listPropagationPackages } from '@/lib/revenue-command-os/execution-autopilot/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){const user=await getCurrentUser();if(!user)return executionError('UNAUTHENTICATED','Authentification requise.',401);if(!executionRights(user).view)return executionError('FORBIDDEN','Permission requise.',403);return NextResponse.json({ok:true,data:await listPropagationPackages(tenantOf(user)),externalActionsExecuted:0})}
