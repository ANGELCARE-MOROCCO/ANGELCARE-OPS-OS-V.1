import { notFound } from 'next/navigation'
import CXCaseDossier from '@/components/flashcards-os/experience/CXCaseDossier'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page({params}:{params:Promise<{caseId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_customer_experience');const {caseId}=await params;const data=await loadExperienceOverview();const item=data.cases.find(x=>x.id===caseId);if(!item)notFound();return <CXCaseDossier item={item} returns={data.returns.filter(x=>x.caseId===caseId)} exchanges={data.exchanges.filter(x=>x.caseId===caseId)} refunds={data.refunds.filter(x=>x.caseId===caseId)} signals={data.qualitySignals.filter(x=>x.caseId===caseId)}/>}
