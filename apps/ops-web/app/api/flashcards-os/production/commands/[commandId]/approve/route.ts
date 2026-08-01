import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, approveCommand } from '@/lib/flashcards-os/production/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{commandId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.approve_commands');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();const {commandId}=await params;return NextResponse.json({command:await approveCommand(decodeURIComponent(commandId),String(body.note||''),actorFromUser(access.user))})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Approval failed.'},{status:400})}}
