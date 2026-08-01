import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { intelligenceEnvironment } from '@/lib/flashcards-os/intelligence/config'
import { processNextIntelligenceJob } from '@/lib/flashcards-os/intelligence/server/jobs'

export async function POST(request:Request){
  const expected=intelligenceEnvironment().governance.workerSecret
  const supplied=request.headers.get('x-flashcards-worker-secret')||request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||''
  if(expected&&supplied===expected){try{return NextResponse.json(await processNextIntelligenceJob('flashcards-os-worker-http'))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Worker failed.'},{status:500})}}
  const access=await assertFlashcardsApiAccess('flashcards_os.execute_research');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status})
  try{return NextResponse.json(await processNextIntelligenceJob(`flashcards-os-user-${String((access.user as any).id||'manual')}`))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Worker failed.'},{status:500})}
}
