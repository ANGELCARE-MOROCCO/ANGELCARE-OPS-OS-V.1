import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { decideProductDesign } from '@/lib/flashcards-os/intelligence/server/repository'

export async function POST(request:Request,context:{params:Promise<{designId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.approve_product_design');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {designId}=await context.params;const body=await request.json();const allowed=['review','approved','rework','rejected','ready_for_umz3','archived'];if(!allowed.includes(String(body.status)))return NextResponse.json({error:'Décision design invalide.'},{status:400});if(String(body.note||'').trim().length<6)return NextResponse.json({error:'Justification obligatoire.'},{status:400});const design=await decideProductDesign(decodeURIComponent(designId),body.status,String(body.note),actorFromUser(access.user));revalidatePath(`/flashcards-os/intelligence/product-design/${designId}`);return NextResponse.json({design})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Design decision failed.'},{status:500})}}
