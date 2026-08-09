import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const files = {
  route: "components/market-os/ambassadors/routes/AmbassadorTerritoriesRoute.tsx",
  map: "components/market-os/ambassadors/territories-map/TerritoryLiveMap.tsx",
  contracts: "components/market-os/ambassadors/territories-map/contracts.ts",
  css: "components/market-os/ambassadors/territories-map/territory-live-map.module.css",
  cssTypes: "components/market-os/ambassadors/territories-map/territory-live-map.module.css.d.ts",
  leafletTypes: "components/market-os/ambassadors/territories-map/leaflet-runtime.d.ts",
  geocode: "app/api/market-os/ambassadors/territories/geocode/route.ts",
  persistence: "lib/market-os/ambassadors/persistence.ts",
  sql: "database/market-os-ambassadors/20260730_market_os_ambassador_territory_live_map_foundation.sql",
  tsconfig: "tsconfig.ambassador-territory-live-map.json",
  package: "package.json",
}

const checks = []
function check(condition, label) {
  checks.push({ condition: Boolean(condition), label })
  console.log(condition ? "PASS" : "FAIL", label)
}
function read(key) {
  const target = path.join(root, files[key])
  check(fs.existsSync(target), `${files[key]} exists`)
  return fs.existsSync(target) ? fs.readFileSync(target, "utf8") : ""
}

const route = read("route")
const map = read("map")
const contracts = read("contracts")
const css = read("css")
read("cssTypes")
read("leafletTypes")
const geocode = read("geocode")
const persistence = read("persistence")
const sql = read("sql")
const tsconfig = read("tsconfig")
const packageJson = read("package")

for (const marker of [
  'data-ambassador-territories-route="enterprise-territory-command-center"',
  "TerritoryLiveMap",
  "mapTerritories",
  "onCreateGeometry={prepareGeometryFromMap}",
  "onUpdateGeometry={updateGeometryFromMap}",
  "territory_geometry_updated",
  "center_latitude",
  "geometry_geojson",
  "AMB_TERRITORY_OS_V2:",
  "/api/market-os/ambassadors/territories/approve",
  "/api/market-os/ambassadors/audit",
]) check(route.includes(marker), `route marker: ${marker}`)

check(!route.includes("CITY_POINTS"), "hardcoded city point registry removed")
check(!route.includes("MAP_OUTLINE"), "static Morocco outline removed")
check(!route.includes('aria-label="Carte opérationnelle simplifiée du Maroc"'), "simplified SVG map removed")
check(!route.includes("localStorage"), "no localStorage persistence introduced")
check(!/\b(?:alert|confirm|prompt)\s*\(/.test(route), "no browser alert/confirm/prompt introduced")

for (const marker of [
  'data-territory-live-map="openstreetmap-command"',
  'await import("leaflet")',
  "NEXT_PUBLIC_AMBASSADOR_MAP_TILE_URL",
  "OpenStreetMap",
  "/api/market-os/ambassadors/territories/geocode",
  'credentials: "include"',
  'cache: "no-store"',
  'startDrawing("radius")',
  'startDrawing("polygon")',
  "geometryAreaKm2",
  "onUpdateGeometry",
  "prefers-reduced-motion",
  "Aucun chiffre injecté",
  "navigator.geolocation",
]) check(map.includes(marker) || css.includes(marker), `map contract marker: ${marker}`)

for (const layer of ["coverage", "workload", "ambassadors", "missions", "leads", "conversion", "potential", "risk"]) {
  check(contracts.includes(`| "${layer}"`) || contracts.includes(`=\n  | "${layer}"`), `layer contract: ${layer}`)
}

check(!map.includes("nominatim.openstreetmap.org"), "browser never calls public Nominatim directly")
check(!map.includes("CITY_POINTS"), "map has no injected city positions")
check(map.includes("MOROCCO_BOUNDS"), "national Morocco viewport is explicit")
check(map.includes("territory.geometryGeoJson"), "real persisted GeoJSON is rendered")
check(map.includes("L.circle"), "real metre-based radius zones are rendered")
check(map.includes("L.geoJSON"), "polygon and administrative GeoJSON are rendered")
check(map.includes("L.tileLayer"), "live tiled basemap is rendered")
check(map.includes("TILE_ATTRIBUTION"), "OSM attribution remains visible")

for (const marker of [
  'requireAmbassadorPermission(actor, "territories.read")',
  'countrycodes", "ma"',
  'polygon_geojson',
  "CACHE_TTL_MS",
  "MIN_PROVIDER_INTERVAL_MS",
  "AMBASSADOR_MAP_GEOCODER_SEARCH_URL",
  "AMBASSADOR_MAP_GEOCODER_REVERSE_URL",
  "User-Agent",
  "normalizeAddress",
  "cacheHit",
]) check(geocode.includes(marker), `protected geocoder marker: ${marker}`)

check(!geocode.includes("telephone"), "geocoder sends no telephone field")
check(!geocode.includes("ambassador_name"), "geocoder sends no Ambassador identity")

for (const field of [
  "center_latitude", "center_longitude", "radius_meters", "geometry_type",
  "geometry_geojson", "area_square_km", "osm_object_type", "osm_object_id",
  "osm_display_name", "geography_updated_at",
]) {
  check(persistence.includes(`"${field}"`), `persistence field: ${field}`)
  check(sql.includes(field), `SQL field: ${field}`)
}

for (const marker of [
  "market_os_ambassador_sync_territory_geography",
  "market_os_ambassador_territories_center_map_idx",
  "market_os_ambassador_territories_geometry_geojson_gin_idx",
  "between -90 and 90",
  "between -180 and 180",
  "contains no personal GPS telemetry",
]) check(sql.includes(marker), `SQL safety marker: ${marker}`)

check(packageJson.includes('"leaflet": "^1.9.4"'), "existing Leaflet dependency is preserved")
check(!packageJson.includes('"mapbox-gl"'), "no proprietary Mapbox runtime introduced")
check(tsconfig.includes("TerritoryLiveMap.tsx"), "targeted TypeScript gate includes live map")
check(tsconfig.includes("AmbassadorTerritoriesRoute.tsx"), "targeted TypeScript gate includes route integration")
check(css.includes(":global(.leaflet-container)"), "Leaflet runtime CSS is locally scoped")
check(css.includes(".zoneLow"), "risk zone visual state exists")
check(css.includes(".zonePending"), "pending approval visual state exists")
check(css.includes("@media (prefers-reduced-motion: reduce)"), "reduced-motion accessibility gate exists")

const failures = checks.filter((item) => !item.condition)
console.log(`\n${checks.length - failures.length}/${checks.length} Ambassador Territory Live Map checks passed.`)
if (failures.length) {
  console.error("\nFailed checks:")
  for (const failure of failures) console.error(` - ${failure.label}`)
  process.exit(1)
}
console.log("Ambassador Territory Live Map source contract accepted.")
