import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, queueOpportunityFromMission } from '@/lib/flashcards-os/intelligence/server/jobs'

export async function POST(request: Request) {
  const access=await assertFlashcardsApiAccess('flashcards_os.manage_opportunities')
  if(!access.ok)return NextResponse.json({error:access.message},{status:access.status})
  try{const body=await request.json();const missionId=String(body.missionId||'');if(!missionId)return NextResponse.json({error:'missionId required.'},{status:400});const result=await queueOpportunityFromMission(missionId,actorFromUser(access.user));return NextResponse.json(result,{status:202})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Opportunity architecture queue failed.'},{status:500})}
}
