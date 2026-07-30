import { requireAmbassadorPermission } from "@/lib/market-os/ambassadors/auth"
import { withAmbassadorActor } from "@/lib/market-os/ambassadors/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type NominatimAddress = Record<string, string | undefined>

type NominatimResult = {
  place_id?: number | string
  licence?: string
  osm_type?: string
  osm_id?: number | string
  lat?: string
  lon?: string
  class?: string
  type?: string
  place_rank?: number
  importance?: number
  addresstype?: string
  name?: string
  display_name?: string
  boundingbox?: string[]
  address?: NominatimAddress
  geojson?: Record<string, unknown>
}

type CacheEntry = {
  expiresAt: number
  payload: NominatimResult[]
}

type GeocodeRuntimeState = {
  cache: Map<string, CacheEntry>
  nextRequestAt: number
  queue: Promise<void>
}

const GLOBAL_KEY = "__angelcareAmbassadorTerritoryGeocoder"
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30
const MIN_PROVIDER_INTERVAL_MS = 1050
const DEFAULT_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
const DEFAULT_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

function runtimeState(): GeocodeRuntimeState {
  const globalRecord = globalThis as typeof globalThis & Record<string, unknown>
  if (!globalRecord[GLOBAL_KEY]) {
    globalRecord[GLOBAL_KEY] = {
      cache: new Map<string, CacheEntry>(),
      nextRequestAt: 0,
      queue: Promise.resolve(),
    } satisfies GeocodeRuntimeState
  }
  return globalRecord[GLOBAL_KEY] as GeocodeRuntimeState
}

function numberValue(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function cleanText(value: unknown, maximum = 220): string {
  return String(value ?? "").trim().slice(0, maximum)
}

function normalizeAddress(value: NominatimAddress | undefined) {
  if (!value || typeof value !== "object") return {}
  const allowed = [
    "city",
    "town",
    "village",
    "municipality",
    "county",
    "state",
    "region",
    "suburb",
    "neighbourhood",
    "road",
    "country",
    "country_code",
  ] as const
  return Object.fromEntries(
    allowed
      .map((key) => [key, cleanText(value[key], 160)] as const)
      .filter(([, item]) => Boolean(item)),
  )
}

function normalizeResult(item: NominatimResult, includeGeoJson: boolean) {
  const latitude = numberValue(item.lat)
  const longitude = numberValue(item.lon)
  if (latitude === null || longitude === null) return null
  const rawBounds = Array.isArray(item.boundingbox) ? item.boundingbox.map(numberValue) : []
  const boundingBox = rawBounds.length === 4 && rawBounds.every((entry) => entry !== null)
    ? rawBounds as [number, number, number, number]
    : null

  return {
    id: cleanText(item.place_id || `${item.osm_type || "place"}-${item.osm_id || `${latitude}-${longitude}`}`),
    displayName: cleanText(item.display_name || item.name || "Lieu sans libellé", 500),
    latitude,
    longitude,
    osmType: cleanText(item.osm_type),
    osmId: cleanText(item.osm_id),
    className: cleanText(item.class),
    typeName: cleanText(item.type || item.addresstype),
    importance: numberValue(item.importance) || 0,
    boundingBox,
    address: normalizeAddress(item.address),
    geoJson: includeGeoJson && item.geojson && typeof item.geojson === "object" ? item.geojson : null,
  }
}

async function providerRequest(url: URL): Promise<NominatimResult[]> {
  const state = runtimeState()
  let releaseQueue!: () => void
  const previous = state.queue
  state.queue = new Promise<void>((resolve) => {
    releaseQueue = resolve
  })

  await previous
  try {
    const delay = Math.max(0, state.nextRequestAt - Date.now())
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    state.nextRequestAt = Date.now() + MIN_PROVIDER_INTERVAL_MS

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": "fr,ar;q=0.8,en;q=0.5",
        "User-Agent": process.env.AMBASSADOR_MAP_GEOCODER_USER_AGENT || "AngelCare-Territory-Command/1.0 (backoffice@angelcarehub.com)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) throw new Error(`Geocoding provider returned HTTP ${response.status}`)
    const payload = await response.json()
    return Array.isArray(payload) ? payload as NominatimResult[] : payload && typeof payload === "object" ? [payload as NominatimResult] : []
  } finally {
    releaseQueue()
  }
}

async function cachedProviderRequest(
  key: string,
  url: URL,
): Promise<{ payload: NominatimResult[]; cacheHit: boolean }> {
  const state = runtimeState()
  const cached = state.cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return { payload: cached.payload, cacheHit: true }
  }
  const payload = await providerRequest(url)
  state.cache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS })
  if (state.cache.size > 800) {
    const firstKey = state.cache.keys().next().value
    if (typeof firstKey === "string") state.cache.delete(firstKey)
  }
  return { payload, cacheHit: false }
}

export async function GET(request: Request) {
  return withAmbassadorActor(request, async (actor) => {
    requireAmbassadorPermission(actor, "territories.read")

    const requestUrl = new URL(request.url)
    const query = cleanText(requestUrl.searchParams.get("q"), 180)
    const latitude = numberValue(requestUrl.searchParams.get("lat"))
    const longitude = numberValue(requestUrl.searchParams.get("lon"))
    const includeGeoJson = requestUrl.searchParams.get("polygon") === "1"
    const requestedLimit = Math.floor(numberValue(requestUrl.searchParams.get("limit")) || 5)
    const limit = Math.max(1, Math.min(5, requestedLimit))

    if (!query && (latitude === null || longitude === null)) {
      return { ok: false, source: "ambassador-territory-geocoder", error: "Provide a place query or latitude/longitude.", status: 400 }
    }

    const searchBase = process.env.AMBASSADOR_MAP_GEOCODER_SEARCH_URL || DEFAULT_SEARCH_URL
    const reverseBase = process.env.AMBASSADOR_MAP_GEOCODER_REVERSE_URL || DEFAULT_REVERSE_URL
    const providerUrl = new URL(query ? searchBase : reverseBase)

    providerUrl.searchParams.set("format", "jsonv2")
    providerUrl.searchParams.set("addressdetails", "1")
    providerUrl.searchParams.set("accept-language", "fr")
    providerUrl.searchParams.set("countrycodes", "ma")

    if (query) {
      providerUrl.searchParams.set("q", query)
      providerUrl.searchParams.set("limit", String(limit))
      providerUrl.searchParams.set("polygon_geojson", includeGeoJson ? "1" : "0")
      providerUrl.searchParams.set("dedupe", "1")
    } else {
      providerUrl.searchParams.set("lat", String(latitude))
      providerUrl.searchParams.set("lon", String(longitude))
      providerUrl.searchParams.set("zoom", "18")
      providerUrl.searchParams.set("polygon_geojson", includeGeoJson ? "1" : "0")
    }

    const cacheKey = `${query ? "search" : "reverse"}:${providerUrl.searchParams.toString()}`
    const providerResult = await cachedProviderRequest(cacheKey, providerUrl)
    const normalized = providerResult.payload
      .map((item) => normalizeResult(item, includeGeoJson))
      .filter(Boolean)
      .slice(0, limit)

    return {
      ok: true,
      source: "ambassador-territory-geocoder",
      data: {
        results: normalized,
        provider: "OpenStreetMap Nominatim",
        countryRestriction: "MA",
        cached: providerResult.cacheHit,
      },
    }
  })
}
