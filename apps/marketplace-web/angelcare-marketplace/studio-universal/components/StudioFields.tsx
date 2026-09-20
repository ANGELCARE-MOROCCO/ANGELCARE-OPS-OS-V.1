'use client'

import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { UniversalSourcePickerField } from '@/angelcare-marketplace/studio-picker/components/UniversalSourcePicker'

export function MediaField({value,onChange}:{value:string|StudioSourceReference|null|undefined;onChange:(value:StudioSourceReference|null)=>void}){
  return <UniversalSourcePickerField sourceId="media.assets" label="Media Vault" description="Choisissez un média existant depuis la source canonique AngelCare." value={value} onChange={next=>onChange(Array.isArray(next)?next[0]||null:next)} legacyValueField="asset_key"/>
}

export function RecordField({kind,value,onChange}:{kind:'category'|'collection';value:string|StudioSourceReference|null|undefined;onChange:(value:StudioSourceReference|null)=>void}){
  const category=kind==='category'
  return <UniversalSourcePickerField sourceId={category?'catalog.categories':'homepage.collections'} label={category?'Catégorie Marketplace':'Collection Marketplace'} description={category?'Sélection hiérarchique depuis le catalogue canonique.':'Sélection depuis les collections gouvernées du Marketplace.'} value={value} onChange={next=>onChange(Array.isArray(next)?next[0]||null:next)} legacyValueField={category?'category_key':'collection_key'}/>
}
