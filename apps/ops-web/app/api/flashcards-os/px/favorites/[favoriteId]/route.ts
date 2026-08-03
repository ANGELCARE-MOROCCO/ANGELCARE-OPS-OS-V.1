import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, deleteFavorite } from '@/lib/flashcards-os/px/repository'
export async function DELETE(_:Request,{params}:{params:Promise<{favoriteId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.view');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const{favoriteId}=await params;return NextResponse.json(await deleteFavorite(favoriteId,actorFromPxUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Favorite deletion failed.'},{status:400})}}
