import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { createProductDesignVersion } from '@/lib/flashcards-os/intelligence/server/repository'

export async function POST(request:Request,context:{params:Promise<{designId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.manage_product_design');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {designId}=await context.params;const body=await request.json();const design=await createProductDesignVersion(decodeURIComponent(designId),String(body.changeSummary||''),actorFromUser(access.user));revalidatePath(`/flashcards-os/intelligence/product-design/${designId}`);return NextResponse.json({design},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Version creation failed.'},{status:500})}}
