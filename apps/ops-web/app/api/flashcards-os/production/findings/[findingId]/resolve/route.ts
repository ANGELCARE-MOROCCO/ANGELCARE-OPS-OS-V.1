import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/production/server/repository'
import { resolveFinding } from '@/lib/flashcards-os/production/server/asset-service'
export async function POST(request:Request,{params}:{params:Promise<{findingId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.resolve_findings');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();const {findingId}=await params;return NextResponse.json(await resolveFinding(decodeURIComponent(findingId),String(body.resolution||''),actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Finding resolution failed.'},{status:400})}}
