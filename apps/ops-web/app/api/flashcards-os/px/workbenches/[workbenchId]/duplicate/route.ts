import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, duplicateWorkbench } from '@/lib/flashcards-os/px/repository'
export async function POST(_:Request,{params}:{params:Promise<{workbenchId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.view');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const{workbenchId}=await params;return NextResponse.json(await duplicateWorkbench(workbenchId,actorFromPxUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Workbench duplication failed.'},{status:400})}}
