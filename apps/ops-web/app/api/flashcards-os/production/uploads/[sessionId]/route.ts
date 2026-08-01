import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { getUploadState } from '@/lib/flashcards-os/production/server/vault-service'
export async function GET(_:Request,{params}:{params:Promise<{sessionId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.view_vault');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {sessionId}=await params;return NextResponse.json(await getUploadState(decodeURIComponent(sessionId)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Upload state failed.'},{status:400})}}
