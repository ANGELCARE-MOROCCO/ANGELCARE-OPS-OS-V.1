import { notFound } from 'next/navigation'
import ProductionCommandForge from '@/components/flashcards-os/production/ProductionCommandForge'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getProductionCommand } from '@/lib/flashcards-os/production/server/repository'
export default async function Page({params}:{params:Promise<{commandId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_commands');const {commandId}=await params;const command=await getProductionCommand(decodeURIComponent(commandId));if(!command)notFound();return <ProductionCommandForge initial={command}/>}
