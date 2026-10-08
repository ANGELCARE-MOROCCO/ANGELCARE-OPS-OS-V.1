export type SurfaceType='homepage'|'marketplace'|'category'|'vertical'|'product'|'transactional'|'navigation'|'footer'|'portal'|'system'
export type SurfaceStatus='draft'|'published'|'paused'|'archived'
export type SurfaceLocale='fr'|'en'|'ar'

export type LocalizedSurfaceCopy={
  eyebrow?:string
  title?:string
  lead?:string
  primary_cta_label?:string
  primary_cta_href?:string
  secondary_cta_label?:string
  secondary_cta_href?:string
  media_url?:string
  [key:string]:unknown
}

export type SurfaceCard={title:string;body?:string;href?:string;media_url?:string;badge?:string}
export type FrontendSurfaceRecord={
  id:string
  surface_key:string
  surface_type:SurfaceType
  title:string
  route_pattern:string
  renderer_key:string
  admin_studio_key:string
  status:SurfaceStatus
  business_editable:boolean
  locale_mode:'localized'|'shared'
  territory_mode:'none'|'optional'|'required'
  content:Record<string,unknown>
  settings:Record<string,unknown>
  published_snapshot?:Record<string,unknown>|null
  published_at?:string|null
  updated_at:string
}

export type SurfaceSectionRecord={
  id:string
  surface_id:string
  section_key:string
  section_type:string
  locale:SurfaceLocale
  territory_id?:string|null
  title?:string|null
  eyebrow?:string|null
  body?:string|null
  primary_cta_label?:string|null
  primary_cta_href?:string|null
  secondary_cta_label?:string|null
  secondary_cta_href?:string|null
  media_url?:string|null
  layout_variant:string
  content:Record<string,unknown>
  settings:Record<string,unknown>
  sort_order:number
  visible:boolean
  status:SurfaceStatus
  updated_at:string
}

export type PublishedSurfaceExperience={
  surface:FrontendSurfaceRecord
  locale:SurfaceLocale
  copy:LocalizedSurfaceCopy
  cards:SurfaceCard[]
  departments:string[]
  sections:SurfaceSectionRecord[]
}

export type FrontendSurfaceDefinition={
  key:string
  title:string
  group:string
  route:string
  type:SurfaceType
  renderer:string
  studio:string
  editable:string[]
  dynamic:string[]
  previewPath:string
}

export type SearchRule={
  id:string
  rule_key:string
  rule_type:'synonym'|'alias'|'pin'|'bury'|'suggestion'|'empty_result'|'banner'
  query_pattern:string
  replacement_query?:string|null
  catalog_item_id?:string|null
  category_key?:string|null
  locale?:SurfaceLocale|null
  priority:number
  content:Record<string,unknown>
  status:'draft'|'active'|'paused'|'archived'
}

export type AssistedOrderOptions={
  customers:Array<{id:string;public_reference:string;display_name:string;email?:string|null;phone?:string|null;family_account_id?:string|null;territory_id?:string|null}>
  items:Array<{id:string;public_reference:string;slug:string;kind:string;sellable_type:string;name_fr:string;price_mode:string;price_amount:number|null;currency_label:string;availability_status:string;category_key?:string|null}>
  territories:Array<{id:string;territory_code:string;name:string;status:string;currency_label?:string|null}>
}

export type AssistedOrderInput={
  customerAccountId?:string|null
  guestName?:string|null
  guestEmail?:string|null
  guestPhone?:string|null
  itemId:string
  journeyType?:string|null
  quantity?:number
  unitPrice?:number|null
  discountAmount?:number|null
  territoryId?:string|null
  scheduledStartAt?:string|null
  scheduledEndAt?:string|null
  address?:string|null
  city?:string|null
  notes?:string|null
  paymentMode?:string|null
  paymentStatus?:'pending'|'paid'|'invoice_later'|'external_verified'|null
  configuration?:Record<string,unknown>
  inquiryId?:string|null
}

export type CustomerCommerceRow={
  id:string
  public_reference:string
  display_name:string
  email?:string|null
  phone?:string|null
  account_kind:string
  status:string
  preferred_locale:string
  premium_status:boolean
  territory_id?:string|null
  created_at:string
  order_count:number
  lifetime_value:number
  last_order_at?:string|null
}

export type CustomerCommerceDossier={
  customer:CustomerCommerceRow
  journeys:Array<Record<string,unknown>>
  payments:Array<Record<string,unknown>>
  wallet:Record<string,unknown>|null
  inquiries:Array<Record<string,unknown>>
  addresses:Array<Record<string,unknown>>
  baskets:Array<Record<string,unknown>>
  savedItems:Array<Record<string,unknown>>
  recentlyViewed:Array<Record<string,unknown>>
}

export type MediaUsageReference={
  source:'registry'|'catalog_item_media'|'homepage_collection'|'homepage_placement'|'catalog_variant'|'navigation'
  object_type:string
  object_id:string
  label:string
  slot_key:string
  route_hint?:string|null
  metadata:Record<string,unknown>
}
