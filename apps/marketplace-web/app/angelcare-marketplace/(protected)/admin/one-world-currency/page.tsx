
import {requireMarketplaceAdminPageContext} from '@/angelcare-marketplace/auth/context'
import {OneWorldClient} from '@/angelcare-marketplace/one-world-currency/OneWorldClient'
export const dynamic='force-dynamic'
export default async function Page(){
 await requireMarketplaceAdminPageContext('marketplace.admin.access')
 return <OneWorldClient/>
}
