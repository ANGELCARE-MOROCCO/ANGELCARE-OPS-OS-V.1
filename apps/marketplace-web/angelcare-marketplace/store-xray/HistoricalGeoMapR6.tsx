'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { XrayHistoricalLayer, XrayHistoricalLocation } from './types'
import css from './historical-r6.module.css'

const Container = MapContainer as unknown as ComponentType<Record<string, unknown>>
const Tiles = TileLayer as unknown as ComponentType<Record<string, unknown>>
const Circle = CircleMarker as unknown as ComponentType<Record<string, unknown>>
const Tip = Tooltip as unknown as ComponentType<Record<string, unknown>>
const palette = { presence: '#1889e8', commerce: '#f7ae31', risk: '#ef5c70', density: '#8e64dd' }
const number = (value: number) => value.toLocaleString('fr-FR')
type Location = XrayHistoricalLocation
type Group = { key: string; lat: number; lng: number; sessions: number; errors: number; commerce: number; locations: Location[] }
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))

function MapView({ locations }: { locations: Location[] }) {
  const map = useMap()
  const key = locations.map(x => x.code+':'+x.city+':'+x.lat+':'+x.lng).join('|')
  useEffect(() => {
    if (!locations.length) { map.setView([24,5],2); return }
    if (locations.length === 1) { map.setView([locations[0].lat, locations[0].lng],5); return }
    map.fitBounds(locations.map(x=>[x.lat,x.lng] as [number,number]), {padding:[60,60],maxZoom:7})
  },[key,map])
  return null
}

function Zoom({ onZoom }: { onZoom: (zoom:number)=>void }) {
  const map=useMapEvents({ zoomend:()=>onZoom(map.getZoom()) })
  return null
}

/** Genuine weighted spatial density of known approximate city bins. */
function DensityCanvas({ groups, weight }: { groups: Group[]; weight:'sessions'|'commerce'|'errors' }) {
  const map=useMap()
  useEffect(()=>{
    const canvas=document.createElement('canvas')
    canvas.className=css.heatCanvas
    canvas.setAttribute('aria-hidden','true')
    const pane=map.getPanes().overlayPane
    pane.appendChild(canvas)
    const draw=()=>{
      const dim=map.getSize(),ratio=clamp(window.devicePixelRatio||1,1,2)
      canvas.width=Math.round(dim.x*ratio)
      canvas.height=Math.round(dim.y*ratio)
      canvas.style.width=dim.x+'px';canvas.style.height=dim.y+'px'
      const offset=map.containerPointToLayerPoint([0,0])
      canvas.style.left=offset.x+'px';canvas.style.top=offset.y+'px'
      const ctx=canvas.getContext('2d')
      if(!ctx)return
      ctx.setTransform(ratio,0,0,ratio,0,0)
      ctx.clearRect(0,0,dim.x,dim.y)
      const maximum=Math.max(1,...groups.map(g=>g[weight]))
      for(const group of groups){
        const point=map.latLngToContainerPoint([group.lat,group.lng])
        const strength=Math.sqrt(Math.max(0,group[weight])/maximum)
        if(strength<=0)continue
        const radius=clamp(32+strength*48,35,84)
        const gradient=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,radius)
        gradient.addColorStop(0,'rgba(232,74,94,'+(.28+.47*strength)+')')
        gradient.addColorStop(.30,'rgba(255,163,48,'+(.24+.35*strength)+')')
        gradient.addColorStop(.65,'rgba(36,176,210,'+(.12+.24*strength)+')')
        gradient.addColorStop(1,'rgba(36,176,210,0)')
        ctx.fillStyle=gradient
        ctx.beginPath();ctx.arc(point.x,point.y,radius,0,Math.PI*2);ctx.fill()
      }
    }
    map.on('moveend zoomend resize',draw)
    draw()
    return ()=>{map.off('moveend zoomend resize',draw);canvas.remove()}
  },[map,groups,weight])
  return null
}

export function HistoricalGeoMapR6({ locations, mode, selected, onSelect }: {
  locations: Location[]
  mode: XrayHistoricalLayer
  selected: string | null
  onSelect: (location: Location)=>void
}) {
  const [zoom,setZoom]=useState(3)
  const groups=useMemo<Group[]>(()=>{
    const precision=zoom<=3?1:zoom<=6?3:zoom<=9?10:100
    const buckets=new Map<string,Group>()
    for(const x of locations){
      if(!Number.isFinite(x.lat)||!Number.isFinite(x.lng)||Math.abs(x.lat)>90||Math.abs(x.lng)>180||(!x.lat&&!x.lng))continue
      const key=x.code+':'+Math.round(x.lat*precision)/precision+':'+Math.round(x.lng*precision)/precision
      const existing=buckets.get(key)
      if(existing){existing.sessions+=x.sessions;existing.commerce+=x.commerce;existing.errors+=x.errors;existing.locations.push(x)}
      else buckets.set(key,{key,lat:x.lat,lng:x.lng,sessions:x.sessions,commerce:x.commerce,errors:x.errors,locations:[x]})
    }
    return [...buckets.values()]
  },[locations,zoom])
  const visible=groups.filter(g=>mode==='density'||mode==='presence'||(mode==='commerce'?g.commerce>0:g.errors>0))
  const weighted=mode==='commerce'?'commerce':mode==='risk'?'errors':'sessions'
  return <div className={css.geoMapWrap}>
    <Container center={[22,5]} zoom={2} minZoom={2} maxZoom={14} scrollWheelZoom={false} className={css.geoMap}>
      <Tiles attribution="&copy; OpenStreetMap contributors" url={process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}/>
      <Zoom onZoom={setZoom}/>
      <MapView locations={locations}/>
      {mode==='density'?<DensityCanvas groups={visible} weight={weighted}/>:visible.map(g=><Circle key={g.key}
        center={[g.lat,g.lng]}
        radius={clamp(6+Math.sqrt(g[weighted])*2.8,7,30)}
        pathOptions={{color:palette[mode],fillColor:palette[mode],fillOpacity:g.locations.some(x=>x.city===selected)?0.9:0.57,weight:2}}
        eventHandlers={{click:()=>onSelect(g.locations[0])}}>
        <Tip sticky={true}><strong>{number(g.sessions)} sessions</strong>
          <div>{g.locations[0].city}, {g.locations[0].code}</div>
          <div>{number(g.commerce)} commerce · {number(g.errors)} incidents</div>
          <div>Région/ville approximative, jamais position précise</div>
          {g.locations.length>1?<div>{g.locations.length} cellules géographiques regroupées</div>:null}
        </Tip>
      </Circle>)}
    </Container>
    <div className={css.mapCoverage}><strong>{number(locations.reduce((n,x)=>n+x.sessions,0))}</strong> sessions associées à des zones de ville approximatives · {mode==='density'?'Densité pondérée':'Clusters selon le zoom'}</div>
    {!locations.length?<div className={css.geoEmpty}>Aucune localisation de ville vérifiable dans cette sélection. Les pays connus restent visibles dans le tableau géographique.</div>:null}
  </div>
}
