import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, getOrCreateScenarioWorkbench } from '@/lib/flashcards-os/px/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.view_solutions');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();return NextResponse.json(await getOrCreateScenarioWorkbench(String(body.scenarioId||''),actorFromPxUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Workbench creation failed.'},{status:400})}}
