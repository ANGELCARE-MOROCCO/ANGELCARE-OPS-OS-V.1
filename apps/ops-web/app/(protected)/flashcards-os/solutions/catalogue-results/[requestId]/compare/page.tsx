import { notFound } from 'next/navigation'
import CatalogueScenarioCompare2030 from '@/components/flashcards-os/catalogue-composer/CatalogueScenarioCompare2030'
import { loadCatalogueCompositionResult } from '@/lib/flashcards-os/catalogue-composer/repository'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
export default async function CatalogueComparePage({params,searchParams}:{params:Promise<{requestId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 await requireFlashcardsPageAccess('flashcards_os.view_solutions')
 const {requestId}=await params;const query=await searchParams;const result=await loadCatalogueCompositionResult(requestId);if(!result)notFound()
 const initialIds=typeof query.ids==='string'?query.ids.split(',').filter(Boolean).slice(0,4):[]
 return <CatalogueScenarioCompare2030 result={result} initialIds={initialIds}/>
}
