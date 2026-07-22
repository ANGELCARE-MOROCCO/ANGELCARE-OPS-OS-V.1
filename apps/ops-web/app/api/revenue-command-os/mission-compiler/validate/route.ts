import type { NextRequest } from 'next/server'
import { handleCompile } from '@/lib/revenue-command-os/mission-compiler/route-handler'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:NextRequest){return handleCompile(request,'validate')}
