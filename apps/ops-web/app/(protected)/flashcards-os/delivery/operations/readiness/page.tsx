import ReleaseReadinessRoom from '@/components/flashcards-os/experience/ReleaseReadinessRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_release_readiness');const data=await loadExperienceOverview();return <ReleaseReadinessRoom checks={data.readiness}/>}
