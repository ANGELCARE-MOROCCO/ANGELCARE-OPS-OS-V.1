import LearnerNeedsStudio from '@/components/flashcards-os/revenue/LearnerNeedsStudio'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getLearner } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{learnerId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_sensitive_learner_data');const {learnerId}=await params;const learner=await getLearner(learnerId);return learner?<LearnerNeedsStudio learner={learner}/>:null}
