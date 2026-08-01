import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/production/server/repository'
import { cancelUpload } from '@/lib/flashcards-os/production/server/vault-service'
export async function POST(_:Request,{params}:{params:Promise<{sessionId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.upload_deliverables');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {sessionId}=await params;return NextResponse.json(await cancelUpload(decodeURIComponent(sessionId),actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Upload cancel failed.'},{status:400})}}
