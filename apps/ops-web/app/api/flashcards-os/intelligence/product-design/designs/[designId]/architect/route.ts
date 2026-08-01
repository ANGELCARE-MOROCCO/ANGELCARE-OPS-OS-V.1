import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, queueProductDesignArchitecture } from '@/lib/flashcards-os/intelligence/server/jobs'

export async function POST(_:Request,context:{params:Promise<{designId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.manage_product_design');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {designId}=await context.params;const result=await queueProductDesignArchitecture(decodeURIComponent(designId),actorFromUser(access.user));return NextResponse.json(result,{status:202})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Product Design architecture queue failed.'},{status:500})}}
