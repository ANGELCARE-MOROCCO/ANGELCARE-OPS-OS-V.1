import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, generateJourneyScenariosForRequest } from '@/lib/flashcards-os/solutions/server/repository'
export async function POST(_:Request,{params}:{params:Promise<{requestId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.generate_journey_scenarios');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {requestId}=await params;return NextResponse.json(await generateJourneyScenariosForRequest(requestId,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Journey generation failed.'},{status:400})}}
