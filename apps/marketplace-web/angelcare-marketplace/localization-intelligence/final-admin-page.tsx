import {requireMarketplaceWorkspacePageContext} from '../auth/context'
import type {MarketplacePermission} from '../domain/types'
import {LocalizationAuthorityCommand} from './components/LocalizationAuthorityCommand'
import {loadLocalizationAuthority,type LocalizationAuthorityMode} from './final-repository'
const PERMISSIONS:Record<LocalizationAuthorityMode,MarketplacePermission>={translations:'marketplace.localization.translations.view',sources:'marketplace.localization.sources.view',glossary:'marketplace.localization.glossary.view',memory:'marketplace.localization.memory.view',reviews:'marketplace.localization.translations.review',seo:'marketplace.localization.seo.view',readiness:'marketplace.localization.readiness.view'}
export async function LocalizationAuthorityPage({mode}:{mode:LocalizationAuthorityMode}){await requireMarketplaceWorkspacePageContext(`localization.${mode}`,PERMISSIONS[mode]);return <LocalizationAuthorityCommand mode={mode} rows={await loadLocalizationAuthority(mode)}/>}
