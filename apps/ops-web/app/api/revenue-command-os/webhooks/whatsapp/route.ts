import { NextResponse } from 'next/server'
import { receiveWebhook } from '@/lib/revenue-command-os/execution-autopilot/webhooks'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){const url=new URL(request.url);const mode=url.searchParams.get('hub.mode'),token=url.searchParams.get('hub.verify_token'),challenge=url.searchParams.get('hub.challenge');if(mode==='subscribe'&&token&&token===process.env.WHATSAPP_VERIFY_TOKEN)return new NextResponse(challenge||'',{status:200});return new NextResponse('Forbidden',{status:403})}
export async function POST(request:Request){const raw=await request.text();const event=await receiveWebhook({adapterCode:'whatsapp',raw,headers:request.headers});return NextResponse.json({ok:event.signatureValid,eventId:event.id},{status:event.signatureValid?200:401})}
