'use client'

import type { StudioDesignStyle, StudioImportedCssRule } from './types'

type Declaration = { property: string; value: string; important: boolean }
type Condition = { kind: 'base' | 'media' | 'container' | 'supports'; query: string }
export type StudioParsedCssRule = { selector: string; declarations: Declaration[]; order: number; condition: Condition }

type Winner = { value: string; important: boolean; specificity: number; order: number }

const INHERITED = new Set(['color','font-family','font-size','font-style','font-weight','font-variant','line-height','letter-spacing','text-align','text-transform','text-indent','visibility','white-space','word-spacing','direction'])
const FORBIDDEN_PROPERTIES = new Set(['behavior','-moz-binding'])
const SAFE_URL = /^(?:https?:|data:image\/|\/|\.\/|\.\.\/|#)/i

const NATIVE_DESIGN_PROPERTIES = new Set([
  'background','background-color','background-image','color','width','max-width','min-height','border-radius','border-color','border-width','box-shadow',
  'font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-transform','text-decoration','text-align','opacity',
  'padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-bottom','gap','display','flex-direction','align-items','justify-content',
  'grid-template-columns','position','overflow','object-fit','aspect-ratio','transform','filter'
])
export function studioDesignPropertySupported(property:string){return property.startsWith('--')||NATIVE_DESIGN_PROPERTIES.has(property.toLowerCase())}

export function studioSpecificity(selector: string) {
  const normalized = selector.replace(/:where\([^)]*\)/g, '')
  const a = (normalized.match(/#[\w-]+/g) || []).length
  const b = (normalized.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length
  const c = (normalized.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?/g, ' ').match(/\b[a-z][\w-]*\b/gi) || []).length
  return a * 100 + b * 10 + c
}

export function safeCssDeclaration(property: string, raw: string) {
  const key = property.trim().toLowerCase()
  let value = raw.trim()
  if (!key || !value || FORBIDDEN_PROPERTIES.has(key)) return null
  if (/expression\s*\(|javascript\s*:|-moz-binding/i.test(value)) return null
  if (/url\(/i.test(value)) {
    const urls = [...value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].map(match => match[2].trim())
    if (urls.some(url => !SAFE_URL.test(url))) return null
  }
  const important = /\s*!important\s*$/i.test(value)
  value = value.replace(/\s*!important\s*$/i, '').trim()
  return { property: key, value, important }
}

function parseDeclarations(body: string) {
  return body.split(';').map(raw => {
    const index = raw.indexOf(':')
    if (index < 1) return null
    return safeCssDeclaration(raw.slice(0, index), raw.slice(index + 1))
  }).filter((row): row is Declaration => Boolean(row))
}

export function parseStudioCss(css: string): StudioParsedCssRule[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: StudioParsedCssRule[] = []
  let order = 0

  const scan = (chunk: string, condition: Condition) => {
    let i = 0
    while (i < chunk.length) {
      while (i < chunk.length && /\s/.test(chunk[i])) i++
      if (i >= chunk.length) break
      const brace = chunk.indexOf('{', i)
      if (brace < 0) break
      const head = chunk.slice(i, brace).trim()
      let depth = 1
      let j = brace + 1
      for (; j < chunk.length && depth; j++) {
        if (chunk[j] === '{') depth++
        else if (chunk[j] === '}') depth--
      }
      if (depth) break
      const body = chunk.slice(brace + 1, j - 1)
      const media = head.match(/^@media\s+(.+)$/i)
      const container = head.match(/^@container(?:\s+[\w-]+)?\s*(.+)$/i)
      const supports = head.match(/^@supports\s+(.+)$/i)
      if (media) scan(body, { kind: 'media', query: media[1].trim() })
      else if (container) scan(body, { kind: 'container', query: container[1].trim() })
      else if (supports) scan(body, { kind: 'supports', query: supports[1].trim() })
      else if (!head.startsWith('@')) {
        for (const selector of head.split(',').map(value => value.trim()).filter(Boolean)) {
          out.push({ selector, declarations: parseDeclarations(body), order: order++, condition })
        }
      }
      i = j
    }
  }

  scan(source, { kind: 'base', query: '' })
  return out
}

function resolveVar(value: string, vars: Record<string, string>, depth = 0): string {
  if (depth > 8 || !value.includes('var(')) return value
  return value.replace(/var\(\s*(--[\w-]+)(?:\s*,\s*([^)]*))?\)/g, (_match, key: string, fallback: string | undefined) => {
    const resolved = vars[key]
    if (resolved != null) return resolveVar(resolved, vars, depth + 1)
    return fallback ? resolveVar(fallback.trim(), vars, depth + 1) : ''
  })
}

function inheritedVariables(element: Element, rules: StudioParsedCssRule[]) {
  const chain: Element[] = []
  let node: Element | null = element
  while (node) { chain.unshift(node); node = node.parentElement }
  const vars: Record<string, string> = {}
  for (const el of chain) {
    const resolved = cascadeForElement(el, rules, vars, true)
    Object.assign(vars, resolved.customProperties)
  }
  return vars
}

function cascadeForElement(element: Element, rules: StudioParsedCssRule[], inheritedVars: Record<string, string>, variablesOnly = false) {
  const winners = new Map<string, Winner>()
  const conditional: StudioImportedCssRule[] = []
  const customProperties = { ...inheritedVars }

  const apply = (property: string, value: string, important: boolean, specificity: number, order: number) => {
    const previous = winners.get(property)
    if (!previous || Number(important) > Number(previous.important) || (important === previous.important && (specificity > previous.specificity || (specificity === previous.specificity && order >= previous.order)))) {
      winners.set(property, { value, important, specificity, order })
    }
  }

  for (const rule of rules) {
    let matches = false
    try { matches = element.matches(rule.selector) } catch { continue }
    if (!matches) continue
    const spec = studioSpecificity(rule.selector)
    if (rule.condition.kind === 'base') {
      for (const declaration of rule.declarations) {
        if (declaration.property.startsWith('--')) {
          customProperties[declaration.property] = resolveVar(declaration.value, customProperties)
          continue
        }
        if (!variablesOnly) apply(declaration.property, resolveVar(declaration.value, customProperties), declaration.important, spec, rule.order)
      }
    } else if (!variablesOnly) {
      const declarations = Object.fromEntries(rule.declarations.filter(row => !row.property.startsWith('--')).map(row => [row.property, resolveVar(row.value, customProperties)]))
      if (Object.keys(declarations).length) conditional.push({ kind: rule.condition.kind, query: rule.condition.query, declarations })
    }
  }

  const inline = element.getAttribute('style') || ''
  for (const declaration of parseDeclarations(inline)) {
    if (declaration.property.startsWith('--')) customProperties[declaration.property] = resolveVar(declaration.value, customProperties)
    else if (!variablesOnly) apply(declaration.property, resolveVar(declaration.value, customProperties), declaration.important, 1000, Number.MAX_SAFE_INTEGER)
  }

  return { winners, conditional, customProperties }
}

function number(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function declarationsToStudioDesign(rows: Record<string, string>, customProperties?: Record<string, string>): StudioDesignStyle {
  const out: StudioDesignStyle = {}
  for (const [key, value] of Object.entries(rows)) {
    const n = number(value)
    if (key === 'background' || key === 'background-color') out.backgroundColor = value
    else if (key === 'background-image') out.backgroundImage = value
    else if (key === 'color') out.color = value
    else if (key === 'width') out.width = value
    else if (key === 'max-width') out.maxWidth = value
    else if (key === 'min-height') out.minHeight = value
    else if (key === 'border-radius' && n != null) out.borderRadius = n
    else if (key === 'border-color') out.borderColor = value
    else if (key === 'border-width' && n != null) out.borderWidth = n
    else if (key === 'box-shadow') out.boxShadow = value
    else if (key === 'font-family') out.fontFamily = value
    else if (key === 'font-size' && n != null) out.fontSize = n
    else if (key === 'font-weight' && n != null) out.fontWeight = n
    else if (key === 'font-style') out.fontStyle = value
    else if (key === 'line-height' && n != null) out.lineHeight = n
    else if (key === 'letter-spacing' && n != null) out.letterSpacing = n
    else if (key === 'text-transform') out.textTransform = value
    else if (key === 'text-decoration') out.textDecoration = value
    else if (key === 'text-align' && ['left','center','right','start','end'].includes(value)) out.textAlign = value as StudioDesignStyle['textAlign']
    else if (key === 'opacity' && n != null) out.opacity = n <= 1 ? n * 100 : n
    else if (key === 'padding-top' && n != null) out.paddingTop = n
    else if (key === 'padding-right' && n != null) out.paddingRight = n
    else if (key === 'padding-bottom' && n != null) out.paddingBottom = n
    else if (key === 'padding-left' && n != null) out.paddingLeft = n
    else if (key === 'margin-top' && n != null) out.marginTop = n
    else if (key === 'margin-bottom' && n != null) out.marginBottom = n
    else if (key === 'gap' && n != null) out.gap = n
    else if (key === 'display') out.display = value
    else if (key === 'flex-direction') out.flexDirection = value
    else if (key === 'align-items') out.alignItems = value
    else if (key === 'justify-content') out.justifyContent = value
    else if (key === 'grid-template-columns') out.gridTemplateColumns = value
    else if (key === 'position') out.position = value
    else if (key === 'overflow') out.overflow = value
    else if (key === 'object-fit') out.objectFit = value
    else if (key === 'aspect-ratio') out.aspectRatio = value
    else if (key === 'transform') out.transform = value
    else if (key === 'filter') out.filter = value
  }
  if (customProperties && Object.keys(customProperties).length) out.customProperties = customProperties
  return out
}

export function computeStudioElementStyle(element: Element, rules: StudioParsedCssRule[]) {
  const inheritedVars = inheritedVariables(element.parentElement || element, rules)
  const current = cascadeForElement(element, rules, inheritedVars)

  // Resolve inherited visual properties from ancestors when absent on the target.
  const inherited: Record<string, string> = {}
  let ancestor = element.parentElement
  while (ancestor) {
    const parentVars = inheritedVariables(ancestor.parentElement || ancestor, rules)
    const parent = cascadeForElement(ancestor, rules, parentVars)
    for (const property of INHERITED) {
      if (current.winners.has(property) || inherited[property] != null) continue
      const winner = parent.winners.get(property)
      if (winner) inherited[property] = winner.value
    }
    ancestor = ancestor.parentElement
  }

  const declarations = { ...inherited, ...Object.fromEntries([...current.winners].map(([property, winner]) => [property, winner.value])) }
  return {
    design: declarationsToStudioDesign(declarations, current.customProperties),
    importedRules: current.conditional,
    declarations,
    customProperties: current.customProperties,
  }
}

export function scopedImportedCss(blockId: string, rules?: StudioImportedCssRule[]) {
  if (!rules?.length) return ''
  const safeId = blockId.replace(/[^a-z0-9_-]/gi, '')
  const selector = `[data-ac-studio-block="${safeId}"]`
  const body = (declarations: Record<string, string>) => Object.entries(declarations).map(([property, value]) => {
    const safe = safeCssDeclaration(property, value)
    return safe ? `${safe.property}:${safe.value};` : ''
  }).join('')
  return rules.map(rule => {
    const declarations = body(rule.declarations)
    if (!declarations) return ''
    if (rule.kind === 'media') return `@media ${rule.query}{${selector}{${declarations}}}`
    if (rule.kind === 'container') return `@container ${rule.query}{${selector}{${declarations}}}`
    if (rule.kind === 'supports') return `@supports ${rule.query}{${selector}{${declarations}}}`
    return ''
  }).join('\n')
}
