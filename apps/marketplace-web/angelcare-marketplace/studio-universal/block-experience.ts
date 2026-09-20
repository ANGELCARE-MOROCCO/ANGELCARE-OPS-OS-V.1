import { ANGELCARE_STUDIO_BLOCK_CONTRACTS } from './block-contracts'
import { ANGELCARE_STUDIO_VISUAL_EXPERIENCES, type StudioVisualExperienceDefinition } from './visual-catalogue'

export interface StudioBlockExperienceMeta { label:string; description:string; family:string; badge:string; preview:'hero'|'media'|'commerce'|'cards'|'cta'|'form'|'layout'|'table'; search:string }

const previewFor=(value:string):StudioBlockExperienceMeta['preview']=>value.includes('hero')?'hero':value.includes('media')||value.includes('image')||value.includes('video')?'media':value.includes('commerce')||value.includes('product')||value.includes('collection')||value.includes('pricing')?'commerce':value.includes('form')||value.includes('contact')?'form':value.includes('cta')||value.includes('conversion')?'cta':value.includes('layout')||value.startsWith('ac_')?'layout':'cards'

const rows:StudioBlockExperienceMeta[]=ANGELCARE_STUDIO_BLOCK_CONTRACTS.map(row=>({label:row.label,description:row.purpose,family:row.group,badge:'CANONIQUE',preview:previewFor(`${row.type} ${row.group}`),search:`${row.label} ${row.purpose} ${row.type} ${row.group}`.toLocaleLowerCase('fr')}))

const visualRows:StudioBlockExperienceMeta[]=ANGELCARE_STUDIO_VISUAL_EXPERIENCES.map((row:StudioVisualExperienceDefinition)=>({label:row.label,description:row.description,family:row.categoryTitle,badge:`${row.categoryKey.slice(0,2)}/10`,preview:previewFor(`${row.family} ${row.canonicalType}`),search:[row.label,row.description,row.categoryTitle,row.family,row.canonicalType,...row.keywords].join(' ').toLocaleLowerCase('fr')}))

export const ANGELCARE_STUDIO_BLOCK_EXPERIENCE=[...visualRows,...rows] as const
const byLabel=new Map(ANGELCARE_STUDIO_BLOCK_EXPERIENCE.map(row=>[row.label,row]))
export function studioBlockExperienceByLabel(label:string){return byLabel.get(label)||null}
export function studioBlockFamilies(){return ['Tous',...Array.from(new Set(ANGELCARE_STUDIO_BLOCK_EXPERIENCE.map(row=>row.family)))]}
export function studioBlockSearchMatches(meta:StudioBlockExperienceMeta,query:string){return !query||meta.search.includes(query.toLocaleLowerCase('fr'))}
