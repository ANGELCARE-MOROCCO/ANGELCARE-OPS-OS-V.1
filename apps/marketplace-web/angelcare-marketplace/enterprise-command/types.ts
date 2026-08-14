export type EnterpriseObjectKind =
  | 'customer'
  | 'family'
  | 'order'
  | 'payment'
  | 'invoice'
  | 'receipt'
  | 'booking'
  | 'subscription'
  | 'catalog_item'
  | 'provider'
  | 'vendor'
  | 'supplier'
  | 'inquiry'
  | 'crm_lead'
  | 'crm_opportunity'
  | 'crm_quote'

export type EnterpriseSearchHit = {
  objectType: EnterpriseObjectKind
  id: string
  reference: string
  title: string
  subtitle: string
  status: string
  route: string
  updatedAt: string | null
  amount?: number | null
  currencyLabel?: string | null
}

export type EnterpriseTimelineEvent = {
  id: string
  source: 'journey' | 'payment' | 'crm' | 'inquiry' | 'wallet' | 'audit' | 'document' | 'customer'
  key: string
  title: string
  description: string | null
  status: string | null
  occurredAt: string
  evidence?: Record<string, unknown>
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
}

export type CustomerCommercialIntelligence = {
  lifetimeRevenue: number
  capturedRevenue: number
  refundedRevenue: number
  averageOrderValue: number
  orderCount: number
  activeOrderCount: number
  paymentCount: number
  invoiceCount: number
  bookingCount: number
  subscriptionCount: number
  inquiryCount: number
  savedCount: number
  recentlyViewedCount: number
  lastOrderAt: string | null
  lastActivityAt: string | null
  favoriteCategories: Array<{ key: string; label: string; count: number }>
  acquisitionSources: Array<{ source: string; count: number }>
}

export type CustomerMegaDossier = {
  customer: Record<string, unknown>
  family: Record<string, unknown> | null
  guardians: Record<string, unknown>[]
  children: Record<string, unknown>[]
  addresses: Record<string, unknown>[]
  orders: Record<string, unknown>[]
  payments: Record<string, unknown>[]
  refunds: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  receipts: Record<string, unknown>[]
  walletAccount: Record<string, unknown> | null
  walletBuckets: Record<string, unknown>[]
  walletLedger: Record<string, unknown>[]
  subscriptions: Record<string, unknown>[]
  bookings: Record<string, unknown>[]
  inquiries: Record<string, unknown>[]
  familyRequests: Record<string, unknown>[]
  supportTickets: Record<string, unknown>[]
  recentlyViewed: Record<string, unknown>[]
  savedItems: Record<string, unknown>[]
  crmLead: Record<string, unknown> | null
  crmAccount: Record<string, unknown> | null
  crmOpportunities: Record<string, unknown>[]
  crmQuotes: Record<string, unknown>[]
  comments: Record<string, unknown>[]
  relations: Record<string, unknown>[]
  timeline: EnterpriseTimelineEvent[]
  intelligence: CustomerCommercialIntelligence
  enterpriseReference: string
  generatedAt: string
}

export type OrderMegaDossier = {
  order: Record<string, unknown>
  lines: Record<string, unknown>[]
  customer: Record<string, unknown> | null
  family: Record<string, unknown> | null
  payments: Record<string, unknown>[]
  refunds: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  receipts: Record<string, unknown>[]
  participants: Record<string, unknown>[]
  events: Record<string, unknown>[]
  actions: Record<string, unknown>[]
  documents: Record<string, unknown>[]
  notifications: Record<string, unknown>[]
  relations: Record<string, unknown>[]
  comments: Record<string, unknown>[]
  timeline: EnterpriseTimelineEvent[]
  phaseReferences: Array<{ phase: string; reference: string; label: string; status: string }>
  enterpriseReference: string
  generatedAt: string
}

export type ProductDoctrineKey =
  | 'physical_product'
  | 'kit'
  | 'one_time_service'
  | 'recurring_service'
  | 'family_service'
  | 'development_activity'
  | 'montessori_programme'
  | 'academy_programme'
  | 'course'
  | 'cohort'
  | 'b2b_solution'
  | 'establishment_programme'
  | 'hospitality_programme'
  | 'health_adjacent_programme'
  | 'corporate_benefit'
  | 'partner_os_plan'
  | 'saas_add_on'
  | 'quality_assessment'
  | 'audit'
  | 'bundle'
  | 'quote_only_solution'

export type ProductDoctrineField = {
  key: string
  label: string
  required: boolean
  type: 'text' | 'number' | 'boolean' | 'enum' | 'date' | 'json'
  group: 'identity' | 'commercial' | 'operations' | 'availability' | 'trust' | 'fulfillment'
  options?: string[]
  description?: string
}

export type ProductDoctrineDefinition = {
  key: ProductDoctrineKey
  label: string
  description: string
  catalogKind: 'product' | 'kit' | 'service' | 'training' | 'audit' | 'saas_module'
  requiredColumns: string[]
  optionalColumns: string[]
  fields: ProductDoctrineField[]
  defaultPriceMode: 'fixed' | 'starting_from' | 'quote_only' | 'subscription'
  defaultAvailability: string
}

export type ProductImportPreviewRow = {
  row: number
  valid: boolean
  action: 'create' | 'update' | 'reject'
  key: string
  name: string
  errors: string[]
  warnings: string[]
  normalized: Record<string, unknown>
}

export type ProductImportPreview = {
  doctrine: ProductDoctrineDefinition
  rows: ProductImportPreviewRow[]
  valid: number
  rejected: number
  creates: number
  updates: number
}

export type LiveVisitorPoint = {
  id: string
  reference: string
  source: 'conversion_session' | 'public_event' | 'recent_view'
  lat: number
  lng: number
  precision: 'event' | 'address' | 'city_centroid' | 'territory_centroid'
  city: string | null
  territory: string | null
  route: string | null
  intent: string | null
  state: string
  locale: string
  catalogItemId: string | null
  catalogItemName: string | null
  customerAccountId: string | null
  customerName: string | null
  ageSeconds: number
  occurredAt: string
}

export type LiveCommercePoint = {
  id: string
  kind: 'order' | 'revenue' | 'inquiry' | 'provider' | 'fulfillment'
  reference: string
  title: string
  status: string
  lat: number
  lng: number
  precision: 'event' | 'address' | 'city_centroid' | 'territory_centroid'
  occurredAt: string
  customerName: string | null
  amount: number | null
  route: string
  territory: string | null
}

export type LiveMarketplaceSnapshot = {
  generatedAt: string
  activeWindowMinutes: number
  totalActive: number
  byIntent: Record<string, number>
  byCity: Record<string, number>
  checkoutActive: number
  cartsActive: number
  anonymous: number
  knownCustomers: number
  ordersInWindow: number
  revenueInWindow: number
  inquiriesInWindow: number
  providersMapped: number
  fulfillmentOpen: number
  points: LiveVisitorPoint[]
  commercePoints: LiveCommercePoint[]
}

export type BusinessPulseEvent = {
  id: string
  kind: 'order' | 'payment' | 'inquiry' | 'customer' | 'catalog' | 'fulfillment' | 'public'
  reference: string
  title: string
  subtitle: string
  status: string
  route: string
  occurredAt: string
  amount?: number | null
  currencyLabel?: string | null
}

export type BusinessPulseSnapshot = {
  generatedAt: string
  events: BusinessPulseEvent[]
  newOrders: number
  capturedPayments: number
  newInquiries: number
  activeFulfillment: number
}

export type DocumentTemplateKey =
  | 'customer_dossier' | 'family_dossier' | 'order_summary' | 'booking_confirmation' | 'fulfillment_sheet'
  | 'quote' | 'proforma' | 'invoice' | 'receipt' | 'refund_confirmation' | 'wallet_statement'
  | 'subscription_summary' | 'provider_mission' | 'quality_report' | 'incident_report' | 'product_sheet' | 'b2b_proposal'

export type DocumentBlockType = 'title' | 'text' | 'section' | 'table' | 'image' | 'qr' | 'signature' | 'legal' | 'divider' | 'spacer'

export type DocumentBlock = {
  id: string
  type: DocumentBlockType
  label: string
  sectionKey?: string
  text?: string
  src?: string
  align?: 'left' | 'center' | 'right'
  size?: 'sm' | 'md' | 'lg'
  width?: 25 | 33 | 50 | 66 | 75 | 100
  visible?: boolean
  settings?: Record<string, unknown>
}

export type DocumentTemplateRecord = {
  id: string
  template_key: DocumentTemplateKey
  name: string
  locale: 'fr' | 'en' | 'ar'
  page_size: 'A4' | 'A3'
  orientation: 'portrait' | 'landscape'
  header_title: string
  header_subtitle: string | null
  footer_text: string | null
  legal_text: string | null
  logo_path: string | null
  accent: string
  sections: string[]
  settings: Record<string, unknown>
  status: string
  updated_at: string
}

export type SegmentPreview = {
  generatedAt: string
  filters: Record<string, unknown>
  customers: Array<{ id: string; reference: string; name: string; email: string | null; city: string | null; orderCount: number; capturedRevenue: number; averageOrderValue: number; walletBalance: number; lastOrderAt: string | null; activeSubscriptions: number; bookingCount: number; acquisitionSources: string[] }>
  total: number
  evaluated: number
  truncated: boolean
}

export type FulfillmentMission = {
  id: string
  reference: string
  title: string
  status: string
  phase: string
  customer: string
  customerAccountId: string | null
  familyAccountId: string | null
  territory: string | null
  scheduledAt: string | null
  scheduledEndAt: string | null
  provider: string | null
  providerId: string | null
  amount: number
  paymentStatus: string
  nextAction: string | null
  journeyType: string
  operationsMissionId: string | null
  operationsMissionStatus: string | null
  fulfillmentCaseId: string | null
  riskLevel: string | null
  route: string
}

export type FulfillmentMissionSnapshot = { generatedAt: string; missions: FulfillmentMission[]; pending: number; active: number; blocked: number; completedToday: number }
