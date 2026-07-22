import type { NextRequest } from 'next/server'
import { handlePropagation } from '@/lib/revenue-command-os/execution-autopilot/route-handler'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:NextRequest){return handlePropagation(request,'prepare')}
