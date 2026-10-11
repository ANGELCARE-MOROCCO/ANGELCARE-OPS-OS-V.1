 'use client'
import {useEffect,useRef,useState} from 'react'
import type {CSSProperties,PointerEvent,KeyboardEvent} from 'react'
import {Headphones} from 'lucide-react'
import type {Locale} from '../types'
import {DEFAULT_DOCK,dockBounds,dockPoint,snapDock,validDock} from './edgeDock'
import type {Dock,Edge} from './edgeDock'
import styles from '../hotline.module.css'
const POSITION_KEY='angelcare:hotline:dock:v1'
export function HotlineLauncher({locale,open,live,label,onToggle}:{locale:Locale;open:boolean;live:boolean;label:string;onToggle:()=>void}){
 const [dock,setDock]=useState<Dock>(DEFAULT_DOCK),[viewport,setViewport]=useState({width:390,height:800,left:0,top:0}),[dragging,setDragging]=useState(false);
 const dockRef=useRef(dock),drag=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null),suppress=useRef(false);
 dockRef.current=dock;
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem(POSITION_KEY)||'null');if(validDock(value))setDock(value)}catch{}
  const resize=()=>{const v=window.visualViewport;setViewport({width:v?.width||window.innerWidth,height:v?.height||window.innerHeight,left:v?.offsetLeft||0,top:v?.offsetTop||0})};resize();window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);
  return()=>{window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('scroll',resize)}
 },[]);
 const bounds=dockBounds(viewport.width,viewport.height),point=dockPoint(dock,bounds);
 const remember=(value:Dock)=>{setDock(value);dockRef.current=value;try{localStorage.setItem(POSITION_KEY,JSON.stringify(value))}catch{}};
 const down=(e:PointerEvent<HTMLButtonElement>)=>{if(e.button!==0)return;suppress.current=false;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:PointerEvent<HTMLButtonElement>)=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.moved=true;if(d.moved){setDragging(true);suppress.current=true;setDock(snapDock(e.clientX-viewport.left-28,e.clientY-viewport.top-28,bounds));e.preventDefault()}};
 const up=(e:PointerEvent<HTMLButtonElement>)=>{if(!drag.current||drag.current.id!==e.pointerId)return;if(drag.current.moved)remember(dockRef.current);drag.current=null;setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)};
 const keyboard=(e:KeyboardEvent<HTMLButtonElement>)=>{const edges:Record<string,Edge>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'top',ArrowDown:'bottom'};if(e.altKey&&edges[e.key]){e.preventDefault();remember({...dock,edge:edges[e.key]})}else if(edges[e.key]){e.preventDefault();remember({...dock,fraction:Math.max(0,Math.min(1,dock.fraction+(['ArrowLeft','ArrowUp'].includes(e.key)?-.06:.06)))})}else if(e.key==='Home'||e.key==='End'){e.preventDefault();remember({...dock,fraction:e.key==='Home'?0:1})}};
 const hint=locale==='ar'?'اسحب إلى حافة الشاشة. Alt + الأسهم لتغيير الحافة.':locale==='fr'?'Glissez vers un bord. Alt + flèches pour changer de bord.':'Drag to a screen edge. Alt + arrows to change edge.';
 const free=locale==='ar'?'مجاني':locale==='fr'?'Gratuit':'Free';
 return <button type="button" className={styles.edgeLauncher} data-edge={dock.edge} data-dragging={dragging} data-live={live} style={{left:point.x+viewport.left,top:point.y+viewport.top} as CSSProperties} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={()=>{drag.current=null;setDragging(false)}} onKeyDown={keyboard} onClick={e=>{if(suppress.current&&e.detail!==0){suppress.current=false;return}suppress.current=false;onToggle()}} title={hint} aria-label={label+' · '+free} aria-expanded={open} aria-controls="angelcare-hotline-window"><span className={styles.edgeOrb}><Headphones size={25}/></span><span className={styles.freeTag}>{free}</span>{live?<span className={styles.livePip} aria-label={locale==='fr'?'Échange en cours':locale==='ar'?'محادثة جارية':'Conversation in progress'}/>:null}</button>
}
