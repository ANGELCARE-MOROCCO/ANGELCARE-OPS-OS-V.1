import { notFound } from 'next/navigation'
import CommandComparisonTheatre from '@/components/flashcards-os/production/CommandComparisonTheatre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getProductionCommand } from '@/lib/flashcards-os/production/server/repository'
export default async function Page({params}:{params:Promise<{commandId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_commands');const {commandId}=await params;const command=await getProductionCommand(decodeURIComponent(commandId));if(!command)notFound();return <CommandComparisonTheatre command={command}/>}
