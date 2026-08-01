import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, recalculateQuotation } from '@/lib/flashcards-os/revenue/server/repository'
export async function POST(_request:Request,{params}:{params:Promise<{quotationId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.create_quotations');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {quotationId}=await params;return NextResponse.json(await recalculateQuotation(quotationId,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Recalculation failed.'},{status:400})}}
