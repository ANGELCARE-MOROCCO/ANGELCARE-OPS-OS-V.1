import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { decideProductOpportunity } from '@/lib/flashcards-os/intelligence/server/repository'

export async function POST(request:Request,context:{params:Promise<{opportunityId:string}>}){
  const access=await assertFlashcardsApiAccess('flashcards_os.manage_opportunities');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status})
  try{const {opportunityId}=await context.params;const body=await request.json();const allowed=['qualified','shortlisted','design_authorised','approved','rejected','deferred','archived'];if(!allowed.includes(String(body.status)))return NextResponse.json({error:'Décision opportunité invalide.'},{status:400});if(String(body.note||'').trim().length<6)return NextResponse.json({error:'Justification obligatoire.'},{status:400});const opportunity=await decideProductOpportunity(decodeURIComponent(opportunityId),body.status,String(body.note),actorFromUser(access.user));revalidatePath(`/flashcards-os/intelligence/opportunities/${opportunityId}`);return NextResponse.json({opportunity})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Opportunity decision failed.'},{status:500})}
}
