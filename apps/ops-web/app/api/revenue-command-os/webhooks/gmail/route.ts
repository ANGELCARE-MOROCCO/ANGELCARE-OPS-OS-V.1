import { NextResponse } from 'next/server'
import { receiveWebhook } from '@/lib/revenue-command-os/execution-autopilot/webhooks'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){const raw=await request.text();const event=await receiveWebhook({adapterCode:'gmail',raw,headers:request.headers});return NextResponse.json({ok:event.signatureValid,eventId:event.id},{status:event.signatureValid?200:401})}
