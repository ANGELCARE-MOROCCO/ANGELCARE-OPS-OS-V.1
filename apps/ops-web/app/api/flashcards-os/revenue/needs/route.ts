import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, createNeedAssessment } from '@/lib/flashcards-os/revenue/server/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.manage_crm_activities');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{return NextResponse.json(await createNeedAssessment(await request.json(),actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Needs assessment failed.'},{status:400})}}
