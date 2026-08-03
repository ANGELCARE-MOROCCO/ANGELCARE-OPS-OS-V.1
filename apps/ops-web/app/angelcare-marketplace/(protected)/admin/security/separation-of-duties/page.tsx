import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listSecurityControls} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.security.view');return <AuthorityWorkspace eyebrow="GOVERNED CONTROL SURFACE" title="Security · Separation Of Duties" copy="Evidence, owner, status, expiry and action remain persistent and auditable." items={await listSecurityControls()}/>}
