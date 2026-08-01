import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, captureExecutiveSnapshot } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(){const access=await assertFlashcardsApiAccess('flashcards_os.capture_executive_snapshots');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{return NextResponse.json(await captureExecutiveSnapshot(actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
