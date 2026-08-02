import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, createCataloguePackageComposition } from '@/lib/flashcards-os/catalogue-composer/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.generate_solution_scenarios');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{return NextResponse.json(await createCataloguePackageComposition(await request.json(),actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Catalogue package composition failed.'},{status:400})}}
