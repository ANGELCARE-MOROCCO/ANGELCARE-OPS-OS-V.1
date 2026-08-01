import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/production/server/repository'
import { finaliseUpload } from '@/lib/flashcards-os/production/server/vault-service'
export async function POST(request:Request,{params}:{params:Promise<{sessionId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.upload_deliverables');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json().catch(()=>({}));const {sessionId}=await params;return NextResponse.json(await finaliseUpload(decodeURIComponent(sessionId),body.checksumExpected?String(body.checksumExpected):null,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Upload finalisation failed.'},{status:400})}}
