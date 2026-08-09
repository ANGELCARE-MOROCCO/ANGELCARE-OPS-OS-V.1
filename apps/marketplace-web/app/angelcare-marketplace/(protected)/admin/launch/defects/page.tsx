import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listDefects} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.launch.view');return <AuthorityWorkspace eyebrow="GOVERNED CONTROL SURFACE" title="Launch · Defects" copy="Evidence, owner, status, expiry and action remain persistent and auditable." items={await listDefects()}/>}
