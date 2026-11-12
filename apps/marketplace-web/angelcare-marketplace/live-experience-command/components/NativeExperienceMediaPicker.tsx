'use client'
import {UI} from '../../digital-customer-experience/components/ui'
import {NativeImagePicker,type NativePickerSelection} from '../../kidflix/StudioPickers'
/** Adapt the existing Vault picker without silently granting DCE admin upload permissions. */
export function NativeExperienceMediaPicker({locale,onSelect,disabled=false}:{locale:'fr'|'en'|'ar';onSelect:(asset:NativePickerSelection)=>void;disabled?:boolean}){
 const provider={
  locale,
  boot:{} as never,
  refresh:async()=>{},
  notify:()=>{},
  open:()=>{},
  create:()=>{},
  preview:()=>{}
 }
 return <UI.Provider value={provider}><NativeImagePicker disabled={disabled} onSelect={onSelect}/></UI.Provider>
}
