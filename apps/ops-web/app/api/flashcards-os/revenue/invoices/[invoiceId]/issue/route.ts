import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, issueInvoice } from '@/lib/flashcards-os/revenue/server/repository'
export async function POST(_request:Request,{params}:{params:Promise<{invoiceId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.issue_invoices');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {invoiceId}=await params;return NextResponse.json(await issueInvoice(invoiceId,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Invoice issue failed.'},{status:400})}}
