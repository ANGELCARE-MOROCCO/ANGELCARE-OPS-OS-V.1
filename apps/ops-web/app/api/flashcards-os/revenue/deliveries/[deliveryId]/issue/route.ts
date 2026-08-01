import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, issueDelivery } from '@/lib/flashcards-os/revenue/server/repository'
export async function POST(_request:Request,{params}:{params:Promise<{deliveryId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.issue_delivery_notes');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {deliveryId}=await params;return NextResponse.json(await issueDelivery(deliveryId,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Delivery issue failed.'},{status:400})}}
