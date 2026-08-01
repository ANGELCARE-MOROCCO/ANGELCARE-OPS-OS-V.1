import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { loadJourneyRequest } from '@/lib/flashcards-os/solutions/server/repository'
import { validateJourneyRequest } from '@/lib/flashcards-os/solutions/server/journey-engine'
export async function POST(_:Request,{params}:{params:Promise<{requestId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.view_solutions');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const {requestId}=await params;const data=await loadJourneyRequest(requestId);if(!data.request)return NextResponse.json({error:'Journey request not found.'},{status:404});const findings=validateJourneyRequest(data.request);return NextResponse.json({valid:findings.length===0,findings})}
