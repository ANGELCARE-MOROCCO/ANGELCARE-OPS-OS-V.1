export const STUDIO_ATTRIBUTION_VERSION=1 as const
export type StudioAttributionSurface='studio_page'|'assigned_template'
export interface StudioAttributionContext{
  version:typeof STUDIO_ATTRIBUTION_VERSION
  surface:StudioAttributionSurface
  pageId:string|null
  pageRoute:string|null
  pageRevisionId:string|null
  templateId:string|null
  templateKey:string|null
  templateRevisionId:string|null
  templateScope:string|null
  blockId:string|null
  interactionId:string|null
  actionId:string|null
  workflowId:string|null
  itemId:string|null
  itemSlug:string|null
  collectionId:string|null
  placementId:string|null
  campaignId:string|null
  audienceId:string|null
  territoryId:string|null
  locale:'fr'|'en'|'ar'
  traceId:string|null
  referrerHost:string|null
  referrerPath:string|null
  visitorHash:string|null
  utmSource:string|null
  utmMedium:string|null
  utmCampaign:string|null
  utmContent:string|null
}
export type StudioAttributionInput=Partial<Omit<StudioAttributionContext,'version'|'surface'|'locale'>>&{version?:1;surface?:StudioAttributionSurface;locale?:'fr'|'en'|'ar'|string}
