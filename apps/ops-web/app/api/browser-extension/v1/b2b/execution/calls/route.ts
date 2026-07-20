import { NextRequest } from 'next/server'
import { handleB2BExecutionRoute } from '@/lib/browser-extension/b2b-execution/route-handler'

export async function POST(req:NextRequest){const clone=req.clone();const body=await clone.json().catch(()=>({}));const command=String(body.commandKey||'b2b.call.result_record');if(!command.startsWith('b2b.call.'))return handleB2BExecutionRoute(req,'b2b.call.result_record');return handleB2BExecutionRoute(req,command)}
