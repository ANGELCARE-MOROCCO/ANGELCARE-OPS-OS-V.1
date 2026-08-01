import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { compileCommand } from '@/lib/flashcards-os/production/server/commands'
import { actorFromUser } from '@/lib/flashcards-os/production/server/repository'
export async function POST(_:Request,{params}:{params:Promise<{commandId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.compile_commands');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {commandId}=await params;return NextResponse.json({command:await compileCommand(decodeURIComponent(commandId),actorFromUser(access.user))})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Compilation failed.'},{status:400})}}
