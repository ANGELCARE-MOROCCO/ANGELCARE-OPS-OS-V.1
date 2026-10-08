'use client'

import type { ComponentData, Data } from '@puckeditor/core'
import { StudioBlockRuntime } from './StudioBlockRuntime'
import { StudioDesignShell } from './StudioDesignShell'
import { StudioWorldLayoutShell } from './StudioWorldLayoutShell'
import { StudioVisualCatalogueRuntime } from './StudioVisualCatalogueRuntime'
import { HomepageProMaxSectionRuntime } from '@/angelcare-marketplace/studio-homepage-pro-max/components/HomepageProMaxSectionRuntime'
import { HOMEPAGE_PRO_MAX_COMPONENT_KEYS } from '@/angelcare-marketplace/studio-homepage-pro-max/recipe'
import { studioVisualExperience } from '../visual-catalogue'
import type { StudioBlockProps, StudioLocale, StudioPickerData } from '../types'
import styles from './studio-runtime.module.css'

const s=(value:unknown)=>value==null?'':String(value)
const nested=(component:ComponentData)=>{const value=(component.props as Record<string,unknown>)?.content;return Array.isArray(value)?value as ComponentData[]:[]}
const isHomepageProMaxType=(type:string)=>HOMEPAGE_PRO_MAX_COMPONENT_KEYS.includes(type)
const localeOf=(value:unknown):StudioLocale=>value==='en'||value==='ar'?value:'fr'

function CandidateComponent({component,pickers,locale}:{component:ComponentData;pickers:StudioPickerData;locale:StudioLocale}){
  const type=s(component.type),props=(component.props||{}) as StudioBlockProps,id=s(props.id)||type
  if(props.hidden===true)return null

  if(type.startsWith('ac_')){
    return <StudioWorldLayoutShell type={type} props={props} authority="candidate-world-factory">{nested(component).map((child,index)=><CandidateComponent key={s(child.props?.id)||index} component={child} pickers={pickers} locale={locale}/>)}</StudioWorldLayoutShell>
  }

  if(isHomepageProMaxType(type)){
    return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules}><HomepageProMaxSectionRuntime type={type} props={{...props,hidden:false} as any} pickers={pickers} mode="editor"/></StudioDesignShell>
  }

  const visual=studioVisualExperience(type)
  if(visual){
    return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules}><StudioVisualCatalogueRuntime definition={visual} props={props} pickers={pickers} editorMode locale={locale}/></StudioDesignShell>
  }

  return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules}><StudioBlockRuntime type={type} props={props} pickers={pickers} locale={locale} editorMode/></StudioDesignShell>
}

export function StudioCandidatePreview({data,pickers}:{data:Data;pickers:StudioPickerData}){
  const root=(data.root?.props||{}) as Record<string,unknown>,locale=localeOf(root.locale),dir=s(root.direction)||(locale==='ar'?'rtl':'ltr')
  return <div className={styles.candidatePreview} lang={locale} dir={dir} data-ac-candidate-runtime="world-visual-authority-v1" data-ac-candidate-engine="canonical-studio-block-runtime">{(data.content||[]).map((component,index)=><CandidateComponent key={s(component.props?.id)||index} component={component} pickers={pickers} locale={locale}/>)}</div>
}
