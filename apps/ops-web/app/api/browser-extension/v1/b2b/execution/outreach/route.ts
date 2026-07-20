import { NextRequest } from 'next/server'
import { handleB2BExecutionRoute } from '@/lib/browser-extension/b2b-execution/route-handler'

export async function POST(req:NextRequest){const clone=req.clone();const body=await clone.json().catch(()=>({}));const command=String(body.commandKey||'b2b.communication.prepare');if(!command.startsWith('b2b.'))return handleB2BExecutionRoute(req,'b2b.communication.prepare');return handleB2BExecutionRoute(req,command)}
