import {requireMarketplaceWorkspacePageContext} from '@/angelcare-marketplace/auth/context'
import {LocalizationQualityCommand} from '@/angelcare-marketplace/localization-intelligence/components/LocalizationQualityCommand'
import {localizationQuality} from '@/angelcare-marketplace/localization-intelligence/repository'
export default async function Page(){await requireMarketplaceWorkspacePageContext('localization.quality','marketplace.localization.inventory.view');return <LocalizationQualityCommand quality={await localizationQuality()}/>}
