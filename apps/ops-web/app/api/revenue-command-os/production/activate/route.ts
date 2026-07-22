import { NextRequest } from 'next/server'
import { actionRoute } from '@/lib/revenue-command-os/mega-production/route-handler'
export async function POST(request:NextRequest){return actionRoute(request,'activate-production')}
