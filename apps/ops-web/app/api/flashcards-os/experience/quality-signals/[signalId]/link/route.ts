import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, linkQualitySignal } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{signalId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.manage_product_quality_signals');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const {signalId}=await params;try{const body=await request.json();return NextResponse.json(await linkQualitySignal(signalId,body,actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
