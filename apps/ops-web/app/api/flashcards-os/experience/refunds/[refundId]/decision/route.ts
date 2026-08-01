import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, decideRefund } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{refundId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.approve_refunds');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const {refundId}=await params;try{const body=await request.json();return NextResponse.json(await decideRefund(refundId,body.decision,body.amountDh,body.note||'',actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
