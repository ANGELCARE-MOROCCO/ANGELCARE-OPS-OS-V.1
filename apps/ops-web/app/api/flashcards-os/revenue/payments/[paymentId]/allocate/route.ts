import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, allocatePayment } from '@/lib/flashcards-os/revenue/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{paymentId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.allocate_payments');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {paymentId}=await params;const body=await request.json();return NextResponse.json(await allocatePayment(paymentId,String(body.invoiceId),Number(body.amountDh),actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Payment allocation failed.'},{status:400})}}
