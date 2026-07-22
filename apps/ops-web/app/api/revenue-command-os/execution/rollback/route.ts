import type { NextRequest } from 'next/server'
import { handleExecutionAction } from '@/lib/revenue-command-os/execution-autopilot/route-handler'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:NextRequest){return handleExecutionAction(request,'rollback')}
