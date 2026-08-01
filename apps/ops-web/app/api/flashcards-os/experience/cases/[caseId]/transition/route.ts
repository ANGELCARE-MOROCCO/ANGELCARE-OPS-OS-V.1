import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, transitionCXCase } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{caseId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.manage_cx_cases');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const {caseId}=await params;try{const body=await request.json();return NextResponse.json(await transitionCXCase(caseId,body.status,body.detail||'',actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
