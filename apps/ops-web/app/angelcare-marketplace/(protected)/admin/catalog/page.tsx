import {CatalogAdminCommand} from '@/angelcare-marketplace/catalog-discovery/components/CatalogAdminCommand'
import {searchDiscovery} from '@/angelcare-marketplace/catalog-discovery/repository'
export default async function Page(){return <CatalogAdminCommand summary={await searchDiscovery({locale:'fr',limit:240})}/>}
