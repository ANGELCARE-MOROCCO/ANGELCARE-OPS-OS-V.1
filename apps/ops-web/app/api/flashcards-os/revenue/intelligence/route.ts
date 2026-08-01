import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, runRevenueIntelligence } from '@/lib/flashcards-os/revenue/server/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.run_commercial_intelligence');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();return NextResponse.json(await runRevenueIntelligence(body.task,body.context,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Commercial intelligence failed.'},{status:400})}}
