import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { BlockContractRegistry } from '@/angelcare-marketplace/experience-builder/components/BlockContractRegistry'
export default async function Page(){await requireMarketplacePageContext('marketplace.cms.view');return <><PageHeader eyebrow="EXPERIENCE · CANONICAL REGISTRY" title="Bibliothèque de blocs" description="Une seule source de vérité : schémas, champs, design, accessibilité, bindings, nesting et parité editor/runtime."/><BlockContractRegistry/></>}
