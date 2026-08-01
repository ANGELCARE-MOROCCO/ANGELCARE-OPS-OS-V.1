import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { createProductOpportunity, loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export async function GET() {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_opportunities')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  const data = await loadIntelligenceOverview()
  return NextResponse.json({ opportunities: data.opportunities, signals: data.signals, sourceMode: data.sourceMode })
}

export async function POST(request: Request) {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_opportunities')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try { const body=await request.json(); if(String(body.title||'').trim().length<6||String(body.thesis||'').trim().length<20) return NextResponse.json({error:'Titre et thèse détaillée requis.'},{status:400}); const opportunity=await createProductOpportunity({title:String(body.title),thesis:String(body.thesis),problemStatement:String(body.problemStatement||''),targetAudience:Array.isArray(body.targetAudience)?body.targetAudience.map(String):[],relatedCollectionIds:Array.isArray(body.relatedCollectionIds)?body.relatedCollectionIds.map(String):[],relatedMissionIds:Array.isArray(body.relatedMissionIds)?body.relatedMissionIds.map(String):[],evidenceClaimIds:Array.isArray(body.evidenceClaimIds)?body.evidenceClaimIds.map(String):[],ownerName:String(body.ownerName||'')},actorFromUser(access.user)); revalidatePath('/flashcards-os/intelligence/opportunities'); return NextResponse.json({opportunity},{status:201}) }
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Opportunity creation failed.'},{status:500})}
}
