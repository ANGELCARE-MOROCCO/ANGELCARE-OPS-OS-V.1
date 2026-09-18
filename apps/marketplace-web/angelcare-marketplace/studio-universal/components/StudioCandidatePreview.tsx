'use client'

import type { ComponentData, Data } from '@puckeditor/core'
import { StudioBlockRuntime } from './StudioBlockRuntime'
import { StudioDesignShell } from './StudioDesignShell'
import type { StudioBlockProps, StudioPickerData } from '../types'
import styles from './studio-runtime.module.css'

const s=(value:unknown)=>value==null?'':String(value)
const nested=(component:ComponentData)=>{const value=(component.props as Record<string,unknown>)?.content;return Array.isArray(value)?value as ComponentData[]:[]}

function CandidateComponent({component,pickers}:{component:ComponentData;pickers:StudioPickerData}){
  const type=s(component.type),props=(component.props||{}) as StudioBlockProps,id=s(props.id)||type
  if(props.hidden===true)return null
  if(type.startsWith('ac_')){
    const kind=type.replace('ac_',''),klass=(styles as Record<string,string>)[kind]||styles.layout
    return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules}><div className={`${styles.layout} ${klass}`}>{nested(component).map((child,index)=><CandidateComponent key={s(child.props?.id)||index} component={child} pickers={pickers}/>)}</div></StudioDesignShell>
  }
  return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules}><StudioBlockRuntime type={type} props={props} pickers={pickers}/></StudioDesignShell>
}

export function StudioCandidatePreview({data,pickers}:{data:Data;pickers:StudioPickerData}){
  const root=(data.root?.props||{}) as Record<string,unknown>,lang=s(root.locale)||'fr',dir=s(root.direction)||(lang==='ar'?'rtl':'ltr')
  return <div className={styles.candidatePreview} lang={lang} dir={dir} data-ac-candidate-runtime="canonical-studio-block-runtime">{(data.content||[]).map((component,index)=><CandidateComponent key={s(component.props?.id)||index} component={component} pickers={pickers}/>)}</div>
}
