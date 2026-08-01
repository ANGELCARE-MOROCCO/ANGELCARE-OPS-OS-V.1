import { notFound } from 'next/navigation'
import FulfilmentPlanDossier from '@/components/flashcards-os/experience/FulfilmentPlanDossier'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page({params}:{params:Promise<{planId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_fulfilment');const {planId}=await params;const data=await loadExperienceOverview();const plan=data.fulfilmentPlans.find(p=>p.id===planId);if(!plan)notFound();return <FulfilmentPlanDossier plan={plan} workOrders={data.workOrders.filter(x=>x.fulfilmentPlanId===planId)} shipments={data.shipments.filter(x=>x.fulfilmentPlanId===planId)} entitlements={data.entitlements.filter(x=>x.fulfilmentPlanId===planId)} exceptions={data.exceptions.filter(x=>x.fulfilmentPlanId===planId)}/>}
