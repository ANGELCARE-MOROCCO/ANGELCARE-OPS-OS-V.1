import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, createOpportunity } from '@/lib/flashcards-os/revenue/server/repository'
export async function POST(request:Request){try{const input=await request.json();const permission=input?.universe==='b2b'?'flashcards_os.manage_b2b_opportunities':'flashcards_os.manage_b2c_opportunities';const access=await assertFlashcardsApiAccess(permission);if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});return NextResponse.json(await createOpportunity(input,actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Opportunity creation failed.'},{status:400})}}
