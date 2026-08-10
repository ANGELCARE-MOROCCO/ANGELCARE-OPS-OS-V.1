import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'
export async function GET(request:Request){
  const access=await assertFlashcardsApiAccess('flashcards_os.view_solutions');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status})
  const universe=new URL(request.url).searchParams.get('universe')==='b2b'?'b2b':'b2c'
  try{return NextResponse.json(await loadCatalogueComposerOptions(universe))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Catalogue unavailable.'},{status:503})}
}
