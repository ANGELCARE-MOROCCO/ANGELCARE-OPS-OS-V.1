import { NextRequest } from 'next/server'
import { handleB2BExecutionRoute } from '@/lib/browser-extension/b2b-execution/route-handler'

export async function GET(req:NextRequest){return handleB2BExecutionRoute(req,'b2b.daily_command.read')}
