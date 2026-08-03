import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, deleteSavedView } from '@/lib/flashcards-os/px/repository'
export async function DELETE(_:Request,{params}:{params:Promise<{viewId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.view');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const{viewId}=await params;return NextResponse.json(await deleteSavedView(viewId,actorFromPxUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Saved view deletion failed.'},{status:400})}}
