'use client'

import type {StudioPickerData} from '@/angelcare-marketplace/studio-universal/types'
import {useStudioMaterializedProps} from '@/angelcare-marketplace/studio-universal/components/StudioMaterializationContext'
import {StudioDesignShell} from '@/angelcare-marketplace/studio-universal/components/StudioDesignShell'
import {HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS} from '../recipe'
import type {HomepageProMaxSectionProps} from '../types'
import {HomepageProMaxSectionRuntime} from './HomepageProMaxSectionRuntime'
import styles from './homepage-pro-max-editor.module.css'

export function HomepageProMaxEditorRuntime({type,props,pickers}:{type:string;props:HomepageProMaxSectionProps;pickers:StudioPickerData}){
 const materialized=useStudioMaterializedProps(props),id=String(materialized.id||type)
 const def=HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.find(row=>row.type===type)
 return <StudioDesignShell blockId={id} style={materialized.sourceDesign} responsive={materialized.responsive} hidden={materialized.hidden}>
  <div className={styles.editorSection} data-section={def?.id||'BLOCK'}>
   <div className={styles.editorBadge}><span>{def?.id||'BLOC'}</span><strong>{def?.label.replace(/^S\d+\s*·\s*/, '')||type}</strong></div>
   <HomepageProMaxSectionRuntime type={type} props={{...materialized,hidden:false}} pickers={pickers} mode="editor"/>
  </div>
 </StudioDesignShell>
}
