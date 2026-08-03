import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listExperiments} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.growth.view');return <AuthorityWorkspace eyebrow="FINAL MARKETPLACE AUTHORITY" title="Experiment Authority" copy="Hypothèses, audiences, guardrails, approbation, résultats et rollout gouvernés." items={await listExperiments()} links={[]}/>}
