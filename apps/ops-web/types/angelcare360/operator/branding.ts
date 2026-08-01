export type BrandDisplayMode = 'angelcare_only' | 'cobrand' | 'customer_primary' | 'white_label'
export type BrandProfileStatus = 'draft' | 'review' | 'approved' | 'published' | 'paused' | 'archived'
export type BrandAssetType = 'logo' | 'favicon' | 'email_header' | 'pdf_header' | 'portal_banner' | 'login_background' | 'signature' | 'other'

export type OperatorBrandProfile = {
  id: string
  client_id: string
  tenant_id: string | null
  school_id: string | null
  profile_key: string
  label: string
  brand_name: string | null
  legal_name: string | null
  display_mode: BrandDisplayMode
  portal_title: string | null
  email_from_name: string | null
  footer_text: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  language_default: string
  activation_scopes: string[]
  entitlement_keys: string[]
  requires_entitlement: boolean
  status: BrandProfileStatus
  effective_at: string | null
  expires_at: string | null
  public_version_token: string
  settings: Record<string, unknown>
  metadata: Record<string, unknown>
  approved_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  client?: { id?: string; display_name?: string; legal_name?: string } | null
  tenant?: { id?: string; tenant_slug?: string; status?: string; school_id?: string | null } | null
}

export type OperatorBrandAsset = {
  id: string
  profile_id: string
  client_id: string
  tenant_id: string | null
  school_id: string | null
  storage_file_id: string
  asset_key: string
  asset_type: BrandAssetType
  file_name: string
  mime_type: string
  size_bytes: number
  width_px: number | null
  height_px: number | null
  sha256_hash: string
  public_token: string
  status: 'active' | 'review' | 'published' | 'archived' | 'rejected'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type BrandRuntime = {
  source: 'official' | 'customer'
  requestedMode: BrandDisplayMode
  resolvedMode: BrandDisplayMode
  clientId: string | null
  tenantId: string | null
  profileId: string | null
  brandName: string
  portalTitle: string
  emailFromName: string
  footerText: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string
  faviconUrl: string | null
  officialLogoUrl: string
  entitlementOk: boolean
  assetOk: boolean
  storageOk: boolean
  fallbackReason: string | null
  scopes: string[]
}

export type BrandGovernanceSnapshot = {
  generatedAt: string
  limits: { maxAssetBytes: number; maxDimensions: number; allowedMimeTypes: string[] }
  official: { logoUrl: string; pngUrl: string; assets: Array<Record<string, unknown>> }
  clients: Array<Record<string, unknown>>
  tenants: Array<Record<string, unknown>>
  profiles: OperatorBrandProfile[]
  assets: OperatorBrandAsset[]
  versions: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  storage: { configured: boolean; host: string; health: Record<string, unknown> | null; error: string | null }
  metrics: {
    totalProfiles: number
    publishedProfiles: number
    customerAssets: number
    whiteLabelProfiles: number
    storageFiles: number
    totalBytes: number
    fallbackProfiles: number
  }
}
