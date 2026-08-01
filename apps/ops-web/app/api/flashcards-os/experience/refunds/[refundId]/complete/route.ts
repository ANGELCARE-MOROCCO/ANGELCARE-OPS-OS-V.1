import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, completeRefund } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{refundId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.complete_refunds');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {refundId}=await params;const body=await request.json();return NextResponse.json(await completeRefund(refundId,body,actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
