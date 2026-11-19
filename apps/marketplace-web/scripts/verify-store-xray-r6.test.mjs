import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const xr='angelcare-marketplace/store-xray/'
const repo=read(xr+'repository.ts')
const dash=read(xr+'StoreXrayCommand.tsx')
const map=read(xr+'GlobalRadarMap.tsx')
const history=read(xr+'HistoricalIntelligenceR6.tsx')
const geo=read(xr+'HistoricalGeoMapR6.tsx')
const types=read(xr+'types.ts')
const route=read('app/api/angelcare-marketplace/analytics/xray/historical/route.ts')
const sql=read('supabase/migrations/20261119110000_angelcare_store_xray_r6_historical_intelligence.sql')

test('R6 retains Store X-Ray authority and preserves live monitoring',()=>{
 assert.match(dash,/HistoricalIntelligenceR6/)
 assert.match(dash,/\['historical', 'Historique & carte R6'\]/)
 assert.match(dash,/tab === 'historical' \? <HistoricalIntelligenceR6\/>/)
 assert.match(dash,/tab === 'live' \? <>/)
 assert.match(dash,/tab === 'historical'\) return/)
 assert.match(route,/requireMarketplaceApiContext\('marketplace\.analytics\.view'\)/)
 assert.match(route,/getXrayHistoricalR6/)
 assert.match(route,/runtime = 'nodejs'/)
})

test('empty, invalid and zero-zero coordinates cannot be plotted',()=>{
 assert.match(repo,/if \(!input \|\| !\/\^\[\+-\]/)
 assert.match(repo,/Math\.abs\(parsed\) > \(axis === 'latitude' \? 90 : 180\)/)
 assert.match(repo,/!\(rawLatitude === 0 && rawLongitude === 0\)/)
 assert.match(map,/!\(rawLat === 0 && rawLng === 0\)/)
 assert.doesNotMatch(map,/COUNTRY_CENTROIDS/)
 assert.doesNotMatch(map,/centroid\[/)
 assert.match(geo,/Math\.abs\(x\.lat\)>90/)
 assert.match(geo,/x\.code.*round/i)
})

test('historical filters and comparisons share the same server-authorized aggregation',()=>{
 for(const k of ['from','to','timezone','granularity','country','device','route','source','campaign','intent','locale','event','search']){
   assert.ok(route.includes("'"+k+"'"),k)
 }
 assert.match(repo,/db\.rpc\('angelcare_xray_historical_r6'/)
 assert.match(repo,/367 \* 86_400_000/)
 assert.match(repo,/retentionVerified: false/)
 assert.match(history,/Promise\.all\(\[/)
 assert.match(history,/const previousFilter=prior/)
 assert.match(history,/new AbortController\(\)/)
 assert.match(history,/order!==seq\.current/)
 assert.match(history,/window\.history\.replaceState/)
 assert.match(history,/setDraft\(next\);apply\(next\)/)
 assert.match(history,/setSaved\(list\)/)
 assert.match(history,/exportCSV/)
 assert.doesNotMatch(history,/fakeSessions|mockVisitors|Math\.random/)
})

test('SQL is strictly aggregated and never opens private telemetry to anon/authenticated',()=>{
 assert.match(sql,/create index if not exists ac_xray_r6_events_created_idx/)
 assert.match(sql,/create or replace function public\.angelcare_xray_historical_r6/)
 assert.match(sql,/security invoker/)
 assert.match(sql,/count\(distinct sid\)/)
 assert.match(sql,/'geoSessions'/)
 assert.match(sql,/from public\.angelcare_marketplace_live_experience_interactions/)
 assert.match(sql,/p_end - p_start > interval '367 days'/)
 assert.match(sql,/revoke all on function public\.angelcare_xray_historical_r6/)
 assert.match(sql,/from public, anon, authenticated/)
 assert.match(sql,/to service_role/)
 assert.doesNotMatch(sql,/grant execute.+to authenticated/i)
 assert.doesNotMatch(sql,/delete from|truncate table|drop table/i)
})

test('map uses actual location bins and weighted density, not national approximations or fake markers',()=>{
 assert.match(geo,/function DensityCanvas/)
 assert.match(geo,/createRadialGradient/)
 assert.match(geo,/const maximum=Math\.max\(1/)
 assert.match(geo,/locations\.map\(x=>\[x\.lat,x\.lng\]/)
 assert.match(geo,/onZoom/)
 assert.doesNotMatch(geo,/COUNTRY_CENTROIDS|Math\.random/)
 assert.match(history,/historical-r6\.module\.css/)
 assert.match(history,/retentionVerified|La rétention/)
 assert.match(history,/history\.geoSessions/)
 assert.match(history,/active/)
})

test('historical map and KPIs are derived from one applied history payload',()=>{
 assert.match(history,/const countries=history\?\.countries/)
 assert.match(history,/history\.timeline/)
 assert.match(history,/locations=\{history\.locations\}/)
 assert.match(history,/history\.sessions/)
 assert.match(history,/history\.commerce/)
 assert.match(history,/history\.errors/)
 assert.match(history,/set\('country'/)
 assert.match(types,/export interface XrayHistoricalSummary/)
 assert.match(types,/geoSessions: number/)
 assert.match(types,/exact: true/)
})
