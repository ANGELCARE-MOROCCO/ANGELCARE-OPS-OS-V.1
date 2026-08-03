import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser } from '@/lib/flashcards-os/px/repository'
import { resolveFlashcardsDocumentSource } from '@/lib/flashcards-os/documents/server/source'
import type { FlashcardsDocumentSourceType } from '@/lib/flashcards-os/documents/types'
export async function GET(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.view');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const url=new URL(request.url);try{return NextResponse.json(await resolveFlashcardsDocumentSource(String(url.searchParams.get('sourceType')||'custom') as FlashcardsDocumentSourceType,String(url.searchParams.get('sourceId')||'custom'),actorFromPxUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Document source unavailable.'},{status:404})}}
