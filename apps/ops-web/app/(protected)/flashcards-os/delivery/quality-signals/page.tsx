import ProductQualityFeedbackLoop from '@/components/flashcards-os/experience/ProductQualityFeedbackLoop'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_product_quality_signals');const data=await loadExperienceOverview();return <ProductQualityFeedbackLoop signals={data.qualitySignals}/>}
