import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, approveReadyPlan } from '@/lib/flashcards-os/solutions/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{planId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.approve_learning_plans');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {planId}=await params;const body=await request.json();return NextResponse.json(await approveReadyPlan(planId,String(body.note||''),actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Ready plan approval failed.'},{status:400})}}
