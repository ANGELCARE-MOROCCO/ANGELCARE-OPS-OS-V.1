import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, selectJourneyScenario } from '@/lib/flashcards-os/solutions/server/repository'
export async function POST(_:Request,{params}:{params:Promise<{scenarioId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.approve_learning_plans');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {scenarioId}=await params;return NextResponse.json(await selectJourneyScenario(scenarioId,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Journey selection failed.'},{status:400})}}
