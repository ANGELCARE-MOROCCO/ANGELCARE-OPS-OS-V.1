import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, createJourneyRequest } from '@/lib/flashcards-os/solutions/server/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.create_journey_requests');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{return NextResponse.json(await createJourneyRequest(await request.json(),actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Journey request creation failed.'},{status:400})}}
