import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { executionError, executionRights } from '@/lib/revenue-command-os/execution-autopilot/api-access'
import { adapterRegistry } from '@/lib/revenue-command-os/execution-autopilot/registry'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){const user=await getCurrentUser();if(!user)return executionError('UNAUTHENTICATED','Authentification requise.',401);if(!executionRights(user).view)return executionError('FORBIDDEN','Permission requise.',403);return NextResponse.json({ok:true,data:adapterRegistry().list().map(x=>x.config),externalActionsExecuted:0})}
