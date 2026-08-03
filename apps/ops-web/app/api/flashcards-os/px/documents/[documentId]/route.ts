import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, deleteDocument } from '@/lib/flashcards-os/px/repository'
export async function DELETE(_:Request,{params}:{params:Promise<{documentId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.view');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const{documentId}=await params;return NextResponse.json(await deleteDocument(documentId,actorFromPxUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Document deletion failed.'},{status:400})}}
