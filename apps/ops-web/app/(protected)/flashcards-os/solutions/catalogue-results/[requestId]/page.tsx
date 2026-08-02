import { notFound } from 'next/navigation'
import CatalogueResultsTheatre from '@/components/flashcards-os/catalogue-composer/CatalogueResultsTheatre'
import { loadCatalogueCompositionResult } from '@/lib/flashcards-os/catalogue-composer/repository'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
export default async function CatalogueResultsPage({params}:{params:Promise<{requestId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {requestId}=await params;const result=await loadCatalogueCompositionResult(requestId);if(!result)notFound();return <CatalogueResultsTheatre result={result}/>}
