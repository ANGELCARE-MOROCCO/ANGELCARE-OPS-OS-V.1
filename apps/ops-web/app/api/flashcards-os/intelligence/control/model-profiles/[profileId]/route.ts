import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { updateModelProfile } from '@/lib/flashcards-os/intelligence/server/repository'

export async function PATCH(request:Request,context:{params:Promise<{profileId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.manage_model_profiles');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {profileId}=await context.params;const body=await request.json();const profile=await updateModelProfile(decodeURIComponent(profileId),body,actorFromUser(access.user));revalidatePath('/flashcards-os/intelligence/control/models');return NextResponse.json({profile})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Model profile update failed.'},{status:500})}}
