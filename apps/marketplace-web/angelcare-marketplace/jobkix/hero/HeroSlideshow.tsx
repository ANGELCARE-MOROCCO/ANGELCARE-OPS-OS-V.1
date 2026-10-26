'use client';
import {useEffect,useState,type CSSProperties} from 'react';
import type {HeroGallery} from './contracts';
import c from './hero.module.css';
export function HeroSlideshow({gallery,variant='opening',fallbackSrc,fallbackMobileSrc}:{gallery:HeroGallery;variant?:'opening'|'home'|'search';fallbackSrc?:string;fallbackMobileSrc?:string}){
 const [active,setActive]=useState(0),[pause,setPause]=useState(false),[reduce,setReduce]=useState(false),[visible,setVisible]=useState(true),[failed,setFailed]=useState<string[]>([]);
 useEffect(()=>{
  const q=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduce(q.matches),visibility=()=>setVisible(document.visibilityState==='visible');change();visibility();
  q.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
  return ()=>{q.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(gallery.slides.length<2||!gallery.autoplay||pause||reduce||!visible)return;
  const ms=gallery.slides[active]?.durationMs||gallery.intervalMs;
  const timer=window.setTimeout(()=>setActive(v=>(v+1)%gallery.slides.length),ms);
  return ()=>window.clearTimeout(timer);
 },[active,gallery,pause,reduce,visible]);
 return <div className={`${c.stage} ${c[variant]}`} style={{'--pm6-duration':gallery.transitionMs+'ms'} as CSSProperties} onMouseEnter={()=>setPause(true)} onMouseLeave={()=>setPause(false)} onFocusCapture={()=>setPause(true)} onBlurCapture={()=>setPause(false)} aria-label="" data-hero-pm6>
  {fallbackSrc&&failed.length>0?<picture aria-hidden="true" className={`${c.slide} ${c.active}`}><source media="(max-width:767px)" srcSet={fallbackMobileSrc||fallbackSrc}/><img alt="" src={fallbackSrc}/></picture>:null}
  {gallery.slides.map((slide,i)=><picture key={slide.id} aria-hidden="true" className={`${c.slide} ${active===i&&!failed.includes(slide.id)?c.active:''} ${gallery.transition==='zoom'?c.zoom:gallery.transition==='slide'?c.slideMotion:gallery.transition==='none'?c.noMotion:''}`} style={{'--pm6-desktop':`${slide.desktopFocal.x}% ${slide.desktopFocal.y}%`,'--pm6-mobile':`${slide.mobileFocal.x}% ${slide.mobileFocal.y}%`} as CSSProperties}>
    <source media="(max-width:767px)" srcSet={slide.mobileUrl}/>
    <img alt="" src={slide.url} onError={()=>{setFailed(ids=>ids.includes(slide.id)?ids:[...ids,slide.id]);if(active===i&&gallery.slides.length>1)setActive(v=>(v+1)%gallery.slides.length);}} loading={i===0?'eager':'lazy'} fetchPriority={i===0?'high':undefined} width={slide.width} height={slide.height}/>
   </picture>)}
  {gallery.slides.length>1&&!reduce?<div className={c.controls} aria-label="Slideshow controls"><button type="button" onClick={()=>setActive(v=>(v-1+gallery.slides.length)%gallery.slides.length)} aria-label="Previous image">‹</button><button type="button" aria-label={pause?'Play slideshow':'Pause slideshow'} onClick={()=>setPause(v=>!v)}>{pause?'▶':'Ⅱ'}</button><button type="button" aria-label="Next image" onClick={()=>setActive(v=>(v+1)%gallery.slides.length)}>›</button></div>:null}
 </div>;
}
