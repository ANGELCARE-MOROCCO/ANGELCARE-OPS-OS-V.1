import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { VendorAuthorityClient } from '@/angelcare-marketplace/vendor-authority/components/VendorAuthorityClient'
import { vendorAuthoritySnapshot } from '@/angelcare-marketplace/vendor-authority/repository'

export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');return <VendorAuthorityClient mode="contracts" snapshot={await vendorAuthoritySnapshot(context)}/>}
