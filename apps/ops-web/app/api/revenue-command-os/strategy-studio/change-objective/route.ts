import type { NextRequest } from 'next/server'
import { handleStudioAction } from '@/lib/revenue-command-os/strategy-studio/route-handler'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:NextRequest){return handleStudioAction(request,'change_objective')}
