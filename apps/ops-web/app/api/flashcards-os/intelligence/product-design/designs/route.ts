import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/intelligence/server/jobs'
import { createProductDesign, loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export async function GET(){const access=await assertFlashcardsApiAccess('flashcards_os.manage_product_design');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const data=await loadIntelligenceOverview();return NextResponse.json({designs:data.designs,sourceMode:data.sourceMode})}
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.manage_product_design');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();const design=await createProductDesign({opportunityId:String(body.opportunityId||''),title:String(body.title||''),executiveThesis:String(body.executiveThesis||''),problemDefinition:String(body.problemDefinition||'')},actorFromUser(access.user));revalidatePath('/flashcards-os/intelligence/product-design');return NextResponse.json({design},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Product Design creation failed.'},{status:500})}}
