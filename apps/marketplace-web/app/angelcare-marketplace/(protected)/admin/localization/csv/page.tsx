import {requireMarketplaceWorkspacePageContext} from '@/angelcare-marketplace/auth/context'
import {CsvCenter} from '@/angelcare-marketplace/localization-intelligence/components/CsvCenter'
export default async function Page(){await requireMarketplaceWorkspacePageContext('localization.exports','marketplace.localization.access');return <CsvCenter/>}
