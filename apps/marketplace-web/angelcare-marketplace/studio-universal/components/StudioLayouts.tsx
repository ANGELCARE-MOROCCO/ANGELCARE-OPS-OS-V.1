'use client'

import type { CSSProperties, ReactNode } from 'react'
import { createStudioDesignFields, designToStyle } from '../design'
import type { StudioDesignStyle } from '../types'
import styles from './studio-runtime.module.css'

export const STUDIO_LAYOUT_KEYS = ['ac_section','ac_container','ac_columns','ac_grid','ac_stack'] as const

type SlotRenderer = (props?: Record<string, unknown>) => ReactNode
type LayoutKind = 'section'|'container'|'columns'|'grid'|'stack'
type LayoutProps = {
  content?: SlotRenderer
  maxWidth?: string
  backgroundColor?: string
  columnsMobile?: number
  columnsTablet?: number
  columnsDesktop?: number
  gapMobile?: number
  gapTablet?: number
  gapDesktop?: number
  paddingXMobile?: number
  paddingXTablet?: number
  paddingXDesktop?: number
  paddingYMobile?: number
  paddingYTablet?: number
  paddingYDesktop?: number
  direction?: 'row'|'column'
  alignItems?: string
  justifyContent?: string
  sourceDesign?: StudioDesignStyle
}
const clamp=(value:unknown,min:number,max:number,fallback:number)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback}
function Frame({kind,content:Content,maxWidth='1460px',backgroundColor='',columnsMobile=1,columnsTablet=2,columnsDesktop=4,gapMobile=16,gapTablet=20,gapDesktop=24,paddingXMobile=20,paddingXTablet=28,paddingXDesktop=40,paddingYMobile=24,paddingYTablet=36,paddingYDesktop=48,direction='column',alignItems='stretch',justifyContent='start',sourceDesign}:LayoutProps&{kind:LayoutKind}){
  const vars={...designToStyle(sourceDesign),
    '--ac-layout-max':maxWidth||'1460px','--ac-cols-mobile':String(clamp(columnsMobile,1,12,1)),'--ac-cols-tablet':String(clamp(columnsTablet,1,12,2)),'--ac-cols-desktop':String(clamp(columnsDesktop,1,12,4)),
    '--ac-gap-mobile':`${clamp(gapMobile,0,160,16)}px`,'--ac-gap-tablet':`${clamp(gapTablet,0,160,20)}px`,'--ac-gap-desktop':`${clamp(gapDesktop,0,160,24)}px`,'--ac-stack-direction':direction,'--ac-align':alignItems,'--ac-justify':justifyContent,
    backgroundColor:backgroundColor||undefined,
    padding:`${clamp(paddingYDesktop,0,240,48)}px ${clamp(paddingXDesktop,0,240,40)}px`,
  } as CSSProperties
  const klass={section:styles.section,container:styles.container,columns:styles.columns,grid:styles.grid,stack:styles.stack}[kind]
  return <div className={`${styles.layout} ${klass}`} data-ac-layout={kind} style={vars}>{Content?<Content className={styles.slot} minEmptyHeight="90px" collisionAxis={kind==='columns'||kind==='grid'?'dynamic':'y'}/>:null}</div>
}
const number=(label:string,min:number,max:number)=>({type:'number' as const,label,min,max})
const slot={content:{type:'slot' as const}}
const spacing={gapMobile:number('Gap mobile',0,160),gapTablet:number('Gap tablette',0,160),gapDesktop:number('Gap desktop',0,160),paddingXMobile:number('Padding X mobile',0,240),paddingXTablet:number('Padding X tablette',0,240),paddingXDesktop:number('Padding X desktop',0,240),paddingYMobile:number('Padding Y mobile',0,240),paddingYTablet:number('Padding Y tablette',0,240),paddingYDesktop:number('Padding Y desktop',0,240)}
const sourceDesign={sourceDesign:{type:'object' as const,label:'Design avancé',objectFields:createStudioDesignFields()}}
const defaults={content:[],maxWidth:'1460px',backgroundColor:'',columnsMobile:1,columnsTablet:2,columnsDesktop:4,gapMobile:16,gapTablet:20,gapDesktop:24,paddingXMobile:20,paddingXTablet:28,paddingXDesktop:40,paddingYMobile:24,paddingYTablet:36,paddingYDesktop:48,direction:'column',alignItems:'stretch',justifyContent:'start',sourceDesign:{}}
function config(kind:LayoutKind,label:string,withColumns=false){return {label,fields:{...slot,maxWidth:{type:'text' as const,label:'Largeur max'},backgroundColor:{type:'text' as const,label:'Arrière-plan'},...(withColumns?{columnsMobile:number('Colonnes mobile',1,12),columnsTablet:number('Colonnes tablette',1,12),columnsDesktop:number('Colonnes desktop',1,12)}:{}),...(kind==='stack'?{direction:{type:'select' as const,label:'Direction',options:[{label:'Verticale',value:'column'},{label:'Horizontale',value:'row'}]}}:{}),...spacing,...sourceDesign},defaultProps:defaults,render:(props:LayoutProps)=><Frame kind={kind}{...props}/>}}
export function createStudioLayoutComponents(){return {ac_section:config('section','Section'),ac_container:config('container','Conteneur'),ac_columns:config('columns','Colonnes',true),ac_grid:config('grid','Grille',true),ac_stack:config('stack','Stack')}}
