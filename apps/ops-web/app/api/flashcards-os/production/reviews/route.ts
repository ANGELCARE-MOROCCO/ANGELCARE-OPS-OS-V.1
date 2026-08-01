import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/production/server/repository'
import { openQualityReview } from '@/lib/flashcards-os/production/server/asset-service'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.create_quality_reviews');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();return NextResponse.json(await openQualityReview({deliverableId:String(body.deliverableId||''),disciplines:Array.isArray(body.disciplines)?body.disciplines:[]},actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Quality review creation failed.'},{status:400})}}
