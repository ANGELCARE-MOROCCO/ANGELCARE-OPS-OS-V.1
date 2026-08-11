export type BrandDisplayMode =
  | 'angelcare_only'
  | 'cobrand'
  | 'customer_primary'
  | 'white_label'

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
