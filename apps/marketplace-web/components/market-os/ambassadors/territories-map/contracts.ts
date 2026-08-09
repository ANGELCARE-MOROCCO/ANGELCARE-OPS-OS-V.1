export type TerritoryMapLayer =
  | "coverage"
  | "workload"
  | "ambassadors"
  | "missions"
  | "leads"
  | "conversion"
  | "potential"
  | "risk"

export type TerritoryMapRisk = "healthy" | "attention" | "critical" | "unconfigured"

export type TerritoryMapAddress = {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  region?: string
  suburb?: string
  neighbourhood?: string
  road?: string
  country?: string
  country_code?: string
}

export type TerritoryMapGeocodeResult = {
  id: string
  displayName: string
  latitude: number
  longitude: number
  osmType: string
  osmId: string
  className: string
  typeName: string
  importance: number
  boundingBox: [number, number, number, number] | null
  address: TerritoryMapAddress
  geoJson: Record<string, unknown> | null
}

export type TerritoryMapGeometryDraft = {
  geometryType: "radius" | "polygon" | "administrative"
  centerLatitude: number
  centerLongitude: number
  radiusKm: number
  geometryGeoJson: Record<string, unknown> | null
  areaSquareKm: number
  osmDisplayName: string
  osmObjectType: string
  osmObjectId: string
  address: TerritoryMapAddress
}

export type TerritoryMapDatum = {
  id: string
  name: string
  region: string
  city: string
  zone: string
  manager: string
  status: string
  coveragePercent: number
  coverageTarget: number
  workloadPercent: number
  activeAmbassadorCount: number
  openMissionCount: number
  leadCount: number
  conversionCount: number
  conversionRate: number
  pendingAssignmentsCount: number
  addressableHouseholds: number
  addressableAccounts: number
  risk: TerritoryMapRisk
  boundaryMode: "administrative" | "radius" | "custom"
  radiusKm: number
  centerLatitude: number | null
  centerLongitude: number | null
  geometryType: "radius" | "polygon" | "administrative" | "none"
  geometryGeoJson: Record<string, unknown> | null
  areaSquareKm: number
  osmDisplayName: string
  osmObjectType: string
  osmObjectId: string
}
