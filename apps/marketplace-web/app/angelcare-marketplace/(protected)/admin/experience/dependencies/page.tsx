import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { DependencyGraphWorkspace } from '@/angelcare-marketplace/experience-builder/components/DependencyGraphWorkspace'
import { listDependencyEdges, listPages } from '@/angelcare-marketplace/experience-builder/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.cms.view');const[edges,pages]=await Promise.all([listDependencyEdges(),listPages()]);return <><PageHeader eyebrow="EXPERIENCE GRAPH" title="Where Used & impact" description="Graphe réel des dépendances extraites des révisions : nesting, pages, routes, médias, catégories, collections et symboles."/><DependencyGraphWorkspace edges={edges} pages={pages}/></>}
