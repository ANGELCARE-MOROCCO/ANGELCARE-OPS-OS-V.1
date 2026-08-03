import FlashcardsMyWork from '@/components/flashcards-os/px/FlashcardsMyWork'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, listDocuments, listFavorites, listRecent, listSavedViews, listWorkbenches } from '@/lib/flashcards-os/px/repository'
export default async function FlashcardsMyWorkPage(){const user=await requireFlashcardsPageAccess('flashcards_os.view');const actor=actorFromPxUser(user);const[workbenches,favorites,views,recent,documents]=await Promise.all([listWorkbenches(actor),listFavorites(actor),listSavedViews(actor),listRecent(actor),listDocuments(actor)]);return <FlashcardsMyWork initial={{workbenches,favorites,views,recent,documents}}/>}
