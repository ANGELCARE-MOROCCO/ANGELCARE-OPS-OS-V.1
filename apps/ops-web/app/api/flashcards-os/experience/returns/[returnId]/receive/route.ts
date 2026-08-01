import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, receiveReturn } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{returnId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.receive_returns');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const {returnId}=await params;try{const body=await request.json();return NextResponse.json(await receiveReturn(returnId,body,actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
