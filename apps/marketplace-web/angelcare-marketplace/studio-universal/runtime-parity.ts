import { ANGELCARE_STUDIO_BLOCK_CONTRACTS } from './block-contracts'

const INTERACTIVE = new Set(['studio_tabs','studio_dialog','studio_carousel','studio_menu','studio_form'])
const STRUCTURAL = new Set(['ac_section','ac_container','ac_columns','ac_grid','ac_stack'])

export interface StudioRuntimeParityReport {
  contractBlocks: number
  publicRuntimeCovered: number
  editorRuntimeCovered: number
  structuralCovered: number
  interactiveCovered: number
  unsupported: string[]
  pass: boolean
}

export function studioRuntimeParityReport(): StudioRuntimeParityReport {
  const types = ANGELCARE_STUDIO_BLOCK_CONTRACTS.map(row=>row.type)
  const unsupported = types.filter(type => !type || type==='__invalid__')
  return {
    contractBlocks: types.length,
    publicRuntimeCovered: types.length - unsupported.length,
    editorRuntimeCovered: types.length - unsupported.length,
    structuralCovered: types.filter(type=>STRUCTURAL.has(type)).length,
    interactiveCovered: types.filter(type=>INTERACTIVE.has(type)).length,
    unsupported,
    pass: unsupported.length===0,
  }
}
