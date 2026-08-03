import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listMetricObservations} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.intelligence.view');return <AuthorityWorkspace eyebrow="FINAL MARKETPLACE AUTHORITY" title="Discovery & Merchandising" copy="Performance réelle des campagnes, catégories, collections, recherche, filtres et recommandations." items={await listMetricObservations(c,'discovery')} links={[]}/>}
