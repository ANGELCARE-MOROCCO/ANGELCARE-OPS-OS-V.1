import {requireMarketplaceWorkspacePageContext} from '@/angelcare-marketplace/auth/context'
import {ScannerCommandCenter} from '@/angelcare-marketplace/localization-intelligence/components/ScannerCommandCenter'
export default async function Page(){await requireMarketplaceWorkspacePageContext('localization.scanner','marketplace.localization.scans.view');return <ScannerCommandCenter/>}
