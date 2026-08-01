import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, createReadyPlanFromScenario } from '@/lib/flashcards-os/solutions/server/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.approve_learning_plans');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();return NextResponse.json(await createReadyPlanFromScenario(String(body.scenarioId||''),body.universe==='b2b'?'b2b':'b2c',actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Ready plan creation failed.'},{status:400})}}
