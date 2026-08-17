import type { CatalogAdminItem, CatalogCategoryAdmin, CommerceRecord, MediaAsset } from '../commerce-studio/types'
import type { ProductDoctrineDefinition, ProductDoctrineKey } from '../enterprise-command/types'

export type AtelierSeverity='healthy'|'attention'|'critical'|'opportunity'

export type AtelierProduct={
  id:string
  reference:string
  itemKey:string
  slug:string
  name:string
  doctrine:ProductDoctrineKey|string
  kind:string
  status:string
  priceMode:string
  priceAmount:number|null
  currencyLabel:string
  availabilityStatus:string
  featured:boolean
  mediaCount:number
  categoryIds:string[]
  categoryCount:number
  availabilityCount:number
  availableTerritories:number
  priceRuleCount:number
  providerCoverage:number
  sessions30d:number
  confirmed30d:number
  conversion30d:number|null
  orders30d:number
  revenue30d:number
  updatedAt:string|null
  missingMedia:boolean
  missingPrice:boolean
  missingCategory:boolean
  missingTranslation:boolean
  health:AtelierSeverity
  healthReasons:string[]
}

export type DoctrineStat={definition:ProductDoctrineDefinition;offers:number;published:number;attention:number;revenue30d:number}
export type CategoryStat={id:string;key:string;title:string;slug:string;status:string;visible:boolean;itemCount:number;publishedItems:number;revenue30d:number}
export type TerritoryAvailabilityStat={id:string;code:string;name:string;status:string;configured:number;available:number;unavailable:number;capacity:number}
export type CommerceAttention={id:string;productId:string;reference:string;title:string;doctrine:string;severity:AtelierSeverity;reason:string;detail:string;value:number;action:'open'|'pricing'|'availability'|'media'|'categories'|'publication'}

export type CommerceProductAtelierSnapshot={
  generatedAt:string
  metrics:{
    total:number;published:number;draft:number;incomplete:number;unavailable:number;priceAttention:number;withoutMedia:number;lowConversion:number;revenue30d:number;orders30d:number
  }
  products:AtelierProduct[]
  categories:CatalogCategoryAdmin[]
  collections:CommerceRecord[]
  territories:CommerceRecord[]
  priceBooks:CommerceRecord[]
  media:MediaAsset[]
  doctrines:DoctrineStat[]
  categoryStats:CategoryStat[]
  territoryStats:TerritoryAvailabilityStat[]
  attention:CommerceAttention[]
  nextMoves:Array<{id:string;title:string;detail:string;action:string;productId?:string;route?:string}>
  recentPublications:CommerceRecord[]
}

export type ProductDrawerTab='overview'|'doctrine'|'commercial'|'pricing'|'media'|'categories'|'availability'|'fulfillment'|'trust'|'performance'|'publication'|'history'
export type ProductResourceRecord=CatalogAdminItem & {missing_media?:boolean;missing_price?:boolean;missing_category?:boolean;missing_translation?:boolean}
