import { notFound } from 'next/navigation'
import CommandCopySurface from '@/components/flashcards-os/production/CommandCopySurface'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getProductionCommand } from '@/lib/flashcards-os/production/server/repository'
export default async function Page({params}:{params:Promise<{commandId:string}>}){await requireFlashcardsPageAccess('flashcards_os.copy_commands');const {commandId}=await params;const command=await getProductionCommand(decodeURIComponent(commandId));if(!command)notFound();return <CommandCopySurface command={command}/>}
