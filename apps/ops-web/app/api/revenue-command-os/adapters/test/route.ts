import type { NextRequest } from 'next/server'
import { handleAdapter } from '@/lib/revenue-command-os/execution-autopilot/route-handler'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:NextRequest){return handleAdapter(request,'test')}
