import {CsvCenter} from '@/angelcare-marketplace/localization-intelligence/components/CsvCenter'
import {requireMarketplaceWorkspacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){await requireMarketplaceWorkspacePageContext('localization.imports','marketplace.localization.access');return <CsvCenter/>}
