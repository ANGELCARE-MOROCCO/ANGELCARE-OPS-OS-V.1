import type { CSSProperties } from 'react'
import type { StudioDesignStyle, StudioResponsiveState } from './types'

export const DEFAULT_STUDIO_DESIGN: StudioDesignStyle = {
  backgroundColor: '', color: '', maxWidth: '', minHeight: '',
  paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
  marginTop: 0, marginBottom: 0, gap: 0,
  borderColor: '', borderWidth: 0, borderRadius: 0, boxShadow: '',
  fontSize: 0, fontWeight: 0, lineHeight: 0, letterSpacing: 0,
  textAlign: 'start', opacity: 100,
}

const n = (value: unknown, min = 0, max = 9999) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : 0
}

export function designToStyle(value?: StudioDesignStyle): CSSProperties {
  if (!value) return {}
  const out: CSSProperties & Record<string, string | number | undefined> = {}
  if (value.backgroundColor) out.backgroundColor = value.backgroundColor
  if (value.backgroundImage) out.backgroundImage = value.backgroundImage
  if (value.width) out.width = value.width
  if (value.color) out.color = value.color
  if (value.maxWidth) out.maxWidth = value.maxWidth
  if (value.minHeight) out.minHeight = value.minHeight
  if (n(value.paddingTop)) out.paddingTop = n(value.paddingTop)
  if (n(value.paddingRight)) out.paddingRight = n(value.paddingRight)
  if (n(value.paddingBottom)) out.paddingBottom = n(value.paddingBottom)
  if (n(value.paddingLeft)) out.paddingLeft = n(value.paddingLeft)
  if (n(value.marginTop)) out.marginTop = n(value.marginTop)
  if (n(value.marginBottom)) out.marginBottom = n(value.marginBottom)
  if (n(value.gap)) out.gap = n(value.gap)
  if (value.borderColor) out.borderColor = value.borderColor
  if (n(value.borderWidth)) { out.borderWidth = n(value.borderWidth); out.borderStyle = 'solid' }
  if (n(value.borderRadius)) out.borderRadius = n(value.borderRadius)
  if (value.boxShadow) out.boxShadow = value.boxShadow
  if (value.fontFamily) out.fontFamily = value.fontFamily
  if (n(value.fontSize)) out.fontSize = n(value.fontSize)
  if (n(value.fontWeight)) out.fontWeight = n(value.fontWeight, 100, 1000)
  if (value.fontStyle) out.fontStyle = value.fontStyle
  if (n(value.lineHeight)) out.lineHeight = n(value.lineHeight, 0.5, 4)
  if (Number.isFinite(Number(value.letterSpacing)) && Number(value.letterSpacing) !== 0) out.letterSpacing = Number(value.letterSpacing)
  if (value.textAlign) out.textAlign = value.textAlign as CSSProperties['textAlign']
  if (value.textTransform) out.textTransform = value.textTransform as CSSProperties['textTransform']
  if (value.textDecoration) out.textDecoration = value.textDecoration
  if (value.display) out.display = value.display as CSSProperties['display']
  if (value.flexDirection) out.flexDirection = value.flexDirection as CSSProperties['flexDirection']
  if (value.alignItems) out.alignItems = value.alignItems as CSSProperties['alignItems']
  if (value.justifyContent) out.justifyContent = value.justifyContent as CSSProperties['justifyContent']
  if (value.gridTemplateColumns) out.gridTemplateColumns = value.gridTemplateColumns
  if (value.position) out.position = value.position as CSSProperties['position']
  if (value.overflow) out.overflow = value.overflow as CSSProperties['overflow']
  if (value.objectFit) out.objectFit = value.objectFit as CSSProperties['objectFit']
  if (value.aspectRatio) out.aspectRatio = value.aspectRatio
  if (value.transform) out.transform = value.transform
  if (value.filter) out.filter = value.filter
  if (value.opacity !== undefined) out.opacity = Math.max(0, Math.min(100, Number(value.opacity))) / 100
  for (const [key, raw] of Object.entries(value.customProperties || {})) {
    if (/^--[a-z0-9_-]+$/i.test(key) && typeof raw === 'string') out[key] = raw.slice(0, 500)
  }
  return out
}

export function responsiveDataAttributes(value?: StudioResponsiveState) {
  return {
    'data-ac-mobile-visible': String(value?.mobileVisible !== false),
    'data-ac-tablet-visible': String(value?.tabletVisible !== false),
    'data-ac-desktop-visible': String(value?.desktopVisible !== false),
  }
}

export function createStudioDesignFields() {
  const number = (label: string, min: number, max: number) => ({ type: 'number' as const, label, min, max })
  return {
    backgroundColor: { type: 'text' as const, label: 'Arrière-plan' },
    backgroundImage: { type: 'text' as const, label: 'Image/gradient CSS' },
    width: { type: 'text' as const, label: 'Largeur' },
    color: { type: 'text' as const, label: 'Couleur texte' },
    maxWidth: { type: 'text' as const, label: 'Largeur max (ex. 1200px, 100%)' },
    minHeight: { type: 'text' as const, label: 'Hauteur min' },
    paddingTop: number('Padding haut', 0, 240),
    paddingRight: number('Padding droite', 0, 240),
    paddingBottom: number('Padding bas', 0, 240),
    paddingLeft: number('Padding gauche', 0, 240),
    marginTop: number('Marge haute', 0, 240),
    marginBottom: number('Marge basse', 0, 240),
    gap: number('Gap', 0, 160),
    borderColor: { type: 'text' as const, label: 'Bordure' },
    borderWidth: number('Épaisseur bordure', 0, 20),
    borderRadius: number('Rayon', 0, 100),
    boxShadow: { type: 'text' as const, label: 'Ombre CSS' },
    fontFamily: { type: 'text' as const, label: 'Police' },
    fontStyle: { type: 'text' as const, label: 'Style police' },
    fontSize: number('Taille texte', 0, 120),
    fontWeight: number('Graisse', 0, 1000),
    lineHeight: number('Interligne ×100', 0, 400),
    letterSpacing: number('Espacement lettres', -10, 30),
    textAlign: { type: 'select' as const, label: 'Alignement', options: [
      { label: 'Début', value: 'start' }, { label: 'Centre', value: 'center' }, { label: 'Fin', value: 'end' },
    ] },
    opacity: number('Opacité %', 0, 100),
  }
}

const responsiveStyleFields=()=>({
  paddingTop:{type:'number' as const,label:'Padding haut',min:0,max:180},paddingBottom:{type:'number' as const,label:'Padding bas',min:0,max:180},
  paddingLeft:{type:'number' as const,label:'Padding gauche',min:0,max:120},paddingRight:{type:'number' as const,label:'Padding droite',min:0,max:120},
  gap:{type:'number' as const,label:'Espacement',min:0,max:120},fontSize:{type:'number' as const,label:'Taille texte',min:0,max:96},
  maxWidth:{type:'text' as const,label:'Largeur max'},textAlign:{type:'select' as const,label:'Alignement',options:[{label:'Début',value:'start'},{label:'Centre',value:'center'},{label:'Fin',value:'end'}]},
})
export const responsiveField = {
  type: 'object' as const,
  label: 'Responsive Pro',
  objectFields: {
    mobileVisible: { type: 'radio' as const, label: 'Mobile', options: [{ label: 'Visible', value: true }, { label: 'Masqué', value: false }] },
    tabletVisible: { type: 'radio' as const, label: 'Tablette', options: [{ label: 'Visible', value: true }, { label: 'Masqué', value: false }] },
    desktopVisible: { type: 'radio' as const, label: 'Desktop', options: [{ label: 'Visible', value: true }, { label: 'Masqué', value: false }] },
    mobileStyle:{type:'object' as const,label:'Mobile · réglages',objectFields:responsiveStyleFields()},
    tabletStyle:{type:'object' as const,label:'Tablette · réglages',objectFields:responsiveStyleFields()},
    desktopStyle:{type:'object' as const,label:'Desktop · réglages',objectFields:responsiveStyleFields()},
  },
}

const cssValue=(key:string,value:unknown)=>{if(value===undefined||value===null||value==='')return'';if(['paddingTop','paddingRight','paddingBottom','paddingLeft','gap','fontSize'].includes(key))return `${Number(value)||0}px`;return String(value)}
const styleCss=(style?:StudioDesignStyle)=>style?Object.entries(style).filter(([key,value])=>value!==undefined&&value!==null&&value!==''&&['paddingTop','paddingRight','paddingBottom','paddingLeft','gap','fontSize','maxWidth','textAlign'].includes(key)).map(([key,value])=>`${key.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`)}:${cssValue(key,value)}`).join(';'):''
export function responsiveStyleCss(blockId:string,value?:StudioResponsiveState){if(!value)return'';const safe=blockId.replace(/[^a-zA-Z0-9_-]/g,'');if(!safe)return'';const mobile=styleCss(value.mobileStyle),tablet=styleCss(value.tabletStyle),desktop=styleCss(value.desktopStyle);return[
 mobile?`@media(max-width:640px){[data-ac-studio-block=\"${safe}\"]{${mobile}}}`:'',
 tablet?`@media(min-width:641px) and (max-width:900px){[data-ac-studio-block=\"${safe}\"]{${tablet}}}`:'',
 desktop?`@media(min-width:901px){[data-ac-studio-block=\"${safe}\"]{${desktop}}}`:'',
].filter(Boolean).join('')}
