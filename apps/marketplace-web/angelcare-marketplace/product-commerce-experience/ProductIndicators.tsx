import {Layers,Ruler,Weight,Languages,FileText,Package,Truck,ShieldCheck,BarChart3,CalendarDays,Box,Info} from 'lucide-react'
import type {Fact} from './model'
import {indicatorKind,indicatorNumber,type IndicatorKind} from './indicator-model'
import s from './product-commerce.module.css'
/** Technical icons; exact public labels and values remain accessible text. */
export function ProductIllustration({kind='generic',className}:{kind?:IndicatorKind;className?:string}) {
 const Icon=kind==='material'?Layers:kind==='dimensions'?Ruler:kind==='weight'?Weight:kind==='language'?Languages:kind==='format'?FileText:kind==='contents'?Package:kind==='storage'?Box:kind==='delivery'?Truck:kind==='care'?ShieldCheck:kind==='level'?BarChart3:kind==='age-min'||kind==='age-max'?CalendarDays:Info
 return <Icon className={className||s.factArtwork} strokeWidth={1.6} aria-hidden="true" focusable="false"/>
}
export function ProductIndicators({facts}:{facts:Fact[]}) {
 return <div className={s.heroFacts}>{facts.map(f=>{const kind=indicatorKind(f.key),number=indicatorNumber(f);return <div key={f.key} className={s.indicator} data-kind={kind}><div className={s.indicatorGraphic} aria-hidden="true"><ProductIllustration kind={kind}/>{number?<b className={s.indicatorNumber}>{number}{kind==='age-min'?<sup>+</sup>:null}</b>:null}</div><div className={s.indicatorCaption}><strong>{f.label}</strong><span className={number?s.indicatorValue:undefined} data-numeric={number?'true':undefined}>{f.value}</span></div></div>})}</div>
}
