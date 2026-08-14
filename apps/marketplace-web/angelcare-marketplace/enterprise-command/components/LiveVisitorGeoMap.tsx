'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LiveCommercePoint, LiveVisitorPoint } from '../types'

type Mode='points'|'clusters'|'heat'
type Layer='sessions'|'checkout'|'cart'|'orders'|'revenue'|'inquiries'|'providers'|'fulfillment'|'all'
type Props={points:LiveVisitorPoint[];commercePoints:LiveCommercePoint[];mode:'morocco'|'global';selected:string|null;onSelect:(id:string)=>void;layer:Layer;display:Mode;playbackAt:string|null}
type MapPoint={id:string;lat:number;lng:number;kind:string;title:string;subtitle:string;precision:string;amount:number|null;occurredAt:string;color:string}
function Fit({points,mode}:{points:MapPoint[];mode:'morocco'|'global'}){const map=useMap();useEffect(()=>{if(points.length){map.fitBounds(points.map(p=>[p.lat,p.lng] as [number,number]),{padding:[34,34],maxZoom:mode==='morocco'?10:6})}else map.setView(mode==='morocco'?[32.8,-6.5]:[20,0],mode==='morocco'?5:2)},[map,points,mode]);return null}
const COLORS:Record<string,string>={session:'#e5484d',known:'#1677ff',checkout:'#f2b544',cart:'#7b61ff',order:'#23a36d',revenue:'#0b8f9c',inquiry:'#d5489c',provider:'#2f6fed',fulfillment:'#e3781f'}
function sessionColor(p:LiveVisitorPoint){const state=`${p.state} ${p.route||''}`.toLowerCase();if(state.includes('checkout'))return COLORS.checkout;if(state.includes('cart')||state.includes('basket'))return COLORS.cart;if(p.customerAccountId)return COLORS.known;return COLORS.session}
export function LiveVisitorGeoMap({points,commercePoints,mode,selected,onSelect,layer,display,playbackAt}:Props){
 const all=useMemo<MapPoint[]>(()=>{
  const cut=playbackAt?new Date(playbackAt).getTime():Number.POSITIVE_INFINITY
  const sessions=points.filter(p=>new Date(p.occurredAt).getTime()<=cut).map(p=>({id:`session:${p.id}`,lat:p.lat,lng:p.lng,kind:'session',title:p.customerName||p.city||p.reference,subtitle:`${p.state} · ${p.catalogItemName||p.route||'Session'}`,precision:p.precision,amount:null,occurredAt:p.occurredAt,color:sessionColor(p)}))
  const commerce=commercePoints.filter(p=>new Date(p.occurredAt).getTime()<=cut).map(p=>({id:p.id,lat:p.lat,lng:p.lng,kind:p.kind,title:p.title,subtitle:`${p.reference} · ${p.status}${p.customerName?` · ${p.customerName}`:''}`,precision:p.precision,amount:p.amount,occurredAt:p.occurredAt,color:COLORS[p.kind]||'#5b6b7a'}))
  return [...sessions,...commerce].filter(p=>{if(layer==='all')return true;if(layer==='sessions')return p.kind==='session';if(layer==='checkout')return p.kind==='session'&&p.color===COLORS.checkout;if(layer==='cart')return p.kind==='session'&&p.color===COLORS.cart;return p.kind===layer})
 },[points,commercePoints,layer,playbackAt])
 const rendered=useMemo(()=>{
  if(display==='points')return all.map(p=>({...p,count:1,members:[p]}))
  const precision=mode==='morocco'?display==='clusters'?0.18:0.12:display==='clusters'?6:4
  const buckets=new Map<string,MapPoint[]>();for(const p of all){const key=`${Math.round(p.lat*precision)/precision}:${Math.round(p.lng*precision)/precision}`;const arr=buckets.get(key)||[];arr.push(p);buckets.set(key,arr)}
  return [...buckets.values()].map(group=>({id:`cluster:${group.map(x=>x.id).join('|')}`,lat:group.reduce((a,p)=>a+p.lat,0)/group.length,lng:group.reduce((a,p)=>a+p.lng,0)/group.length,kind:group.length>1?'cluster':group[0].kind,title:group.length>1?`${group.length} signaux`:group[0].title,subtitle:group.length>1?`${new Set(group.map(x=>x.kind)).size} types · ${group.reduce((a,p)=>a+(p.amount||0),0).toLocaleString('fr-FR')} Dh`:group[0].subtitle,precision:group.some(x=>x.precision==='address'||x.precision==='event')?'mixed/live':'coarse',amount:group.reduce((a,p)=>a+(p.amount||0),0),occurredAt:group.map(x=>x.occurredAt).sort().at(-1)||new Date().toISOString(),color:group.length>1?'#112e49':group[0].color,count:group.length,members:group}))
 },[all,display,mode])
 return <MapContainer center={mode==='morocco'?[32.8,-6.5]:[20,0]} zoom={mode==='morocco'?5:2} minZoom={2} maxZoom={18} scrollWheelZoom className="ac-live-leaflet"><TileLayer attribution="&copy; OpenStreetMap contributors" url={process.env.NEXT_PUBLIC_OSM_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}/><Fit points={rendered} mode={mode}/>{rendered.map(point=><CircleMarker key={point.id} center={[point.lat,point.lng]} radius={display==='heat'?Math.min(34,10+Math.sqrt(point.count)*8):Math.min(18,6+Math.sqrt(point.count)*3)} pathOptions={{color:point.color,fillColor:point.color,fillOpacity:display==='heat'?0.18:selected===point.id?0.95:0.68,weight:selected===point.id?3:display==='heat'?1:1.5}} eventHandlers={{click:()=>{const target=point.members[0];onSelect(target.id)}}}><Tooltip direction="top"><strong>{point.title}</strong><br/>{point.subtitle}<br/>{point.count>1?`${point.count} signaux · `:''}{point.precision}{point.amount?` · ${point.amount.toLocaleString('fr-FR')} Dh`:''}</Tooltip></CircleMarker>)}</MapContainer>}
