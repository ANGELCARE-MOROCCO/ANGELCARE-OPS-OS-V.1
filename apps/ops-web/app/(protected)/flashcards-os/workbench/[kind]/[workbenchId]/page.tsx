import { notFound } from 'next/navigation'
import FlashcardsDirectWorkbench from '@/components/flashcards-os/px/FlashcardsDirectWorkbench'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, getWorkbench } from '@/lib/flashcards-os/px/repository'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'

export default async function FlashcardsWorkbenchPage({params}:{params:Promise<{kind:string;workbenchId:string}>}){
 const user=await requireFlashcardsPageAccess('flashcards_os.view');const {kind,workbenchId}=await params;const [data,options]=await Promise.all([getWorkbench(workbenchId,actorFromPxUser(user)),loadCatalogueComposerOptions()]);if(!data||data.workbench.kind!==kind)notFound();return <FlashcardsDirectWorkbench initial={data} catalogue={options.collections}/>
}
