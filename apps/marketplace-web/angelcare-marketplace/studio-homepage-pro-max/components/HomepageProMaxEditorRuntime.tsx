'use client'
import type {StudioPickerData} from '@/angelcare-marketplace/studio-universal/types'
import {useStudioMaterializedProps} from '@/angelcare-marketplace/studio-universal/components/StudioMaterializationContext'
import {StudioDesignShell} from '@/angelcare-marketplace/studio-universal/components/StudioDesignShell'
import type {HomepageProMaxSectionProps} from '../types'
import {HomepageProMaxSectionRuntime} from './HomepageProMaxSectionRuntime'
export function HomepageProMaxEditorRuntime({type,props,pickers}:{type:string;props:HomepageProMaxSectionProps;pickers:StudioPickerData}){const materialized=useStudioMaterializedProps(props),id=String(materialized.id||type);return <StudioDesignShell blockId={id} style={materialized.sourceDesign} responsive={materialized.responsive} hidden={materialized.hidden}><HomepageProMaxSectionRuntime type={type} props={{...materialized,hidden:false}} pickers={pickers} mode="editor"/></StudioDesignShell>}
