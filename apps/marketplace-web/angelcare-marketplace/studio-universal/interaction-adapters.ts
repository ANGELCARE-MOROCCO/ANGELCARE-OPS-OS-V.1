'use client'

import type { StudioInteractionRecord } from './types'

const clean = (value: string) => value.replace(/\s+/g, ' ').trim()

export function detectStudioInteractions(doc: Document): StudioInteractionRecord[] {
  const out: StudioInteractionRecord[] = []
  let index = 0
  const push = (kind: string, status: StudioInteractionRecord['status'], note: string, selector: string) => {
    const nodes = [...doc.querySelectorAll(selector)]
    if (!nodes.length) return
    out.push({ kind, sourceNodeId: `interaction-${++index}`, status, note, count: nodes.length })
  }
  push('accordion', 'adapter', 'details/summary → accordéon natif AngelCare.', 'details')
  push('tabs', 'adapter', 'Tabs ARIA → adaptateur onglets AngelCare.', '[role="tablist"]')
  push('dialog', 'adapter', 'Dialog → modal contrôlée AngelCare sans JS source.', 'dialog')
  push('popover', 'adapter', 'Popover → surface contrôlée AngelCare.', '[popover],[popovertarget]')
  push('carousel', 'adapter', 'Carousel/slider → navigation locale contrôlée.', '[class*="carousel" i],[class*="slider" i],[aria-roledescription="carousel"]')
  push('menu', 'adapter', 'Menu/dropdown → disclosure contrôlé et navigable au clavier.', '[role="menu"],[class*="dropdown" i],[class*="mega-menu" i]')
  push('lightbox', 'adapter', 'Lightbox → modal média contrôlée.', '[class*="lightbox" i],[data-lightbox]')
  push('form', 'review', 'Formulaire détecté : destination externe jamais conservée automatiquement.', 'form')
  push('canvas', 'island', 'Canvas sans runtime reconnu : îlot contrôlé ou reconstruction native.', 'canvas')
  push('web-component', 'review', 'Web Component détecté : adaptation explicite ou îlot contrôlé.', '*')
  return out.filter(row => row.kind !== 'web-component' || [...doc.querySelectorAll('*')].some(node => node.tagName.includes('-')))
}

export function interactionComponentForElement(element: Element) {
  if (element.matches('details') || element.querySelector('details')) return 'studio_accordion'
  if (element.matches('[role="tablist"]') || element.querySelector('[role="tablist"]')) return 'studio_tabs'
  if (element.matches('dialog') || element.querySelector('dialog')) return 'studio_dialog'
  if (element.matches('[popover],[popovertarget]') || element.querySelector('[popover],[popovertarget]')) return 'studio_dialog'
  if (element.matches('[class*="carousel" i],[class*="slider" i],[aria-roledescription="carousel"]') || element.querySelector('[class*="carousel" i],[class*="slider" i],[aria-roledescription="carousel"]')) return 'studio_carousel'
  if (element.matches('[role="menu"],[class*="dropdown" i],[class*="mega-menu" i]') || element.querySelector('[role="menu"],[class*="dropdown" i],[class*="mega-menu" i]')) return 'studio_menu'
  if (element.matches('form') || element.querySelector('form')) return 'studio_form'
  if (element.matches('canvas,[class*="webgl" i]') || element.querySelector('canvas,[class*="webgl" i]')) return 'studio_island'
  return null
}

export function interactionItems(element: Element, type: string) {
  if (type === 'studio_accordion') return [...element.querySelectorAll('details')].map((details, index) => ({ title: clean(details.querySelector('summary')?.textContent || `Question ${index + 1}`), body: clean([...details.childNodes].filter(node => !(node instanceof Element && node.tagName.toLowerCase() === 'summary')).map(node => node.textContent || '').join(' ')) }))
  if (type === 'studio_tabs') return [...element.querySelectorAll('[role="tab"]')].map((tab, index) => {
    const controls = tab.getAttribute('aria-controls')
    const panel = controls ? element.ownerDocument.getElementById(controls) : null
    return { title: clean(tab.textContent || `Onglet ${index + 1}`), body: clean(panel?.textContent || '') }
  })
  if (type === 'studio_carousel') return [...element.querySelectorAll('article,figure,[class*="slide" i]')].slice(0, 24).map((item, index) => ({ title: clean(item.querySelector('h1,h2,h3,h4,strong')?.textContent || `Slide ${index + 1}`), body: clean(item.querySelector('p')?.textContent || ''), mediaUrl: item.querySelector('img')?.getAttribute('src') || '', mediaAlt: item.querySelector('img')?.getAttribute('alt') || '' }))
  if (type === 'studio_menu') return [...element.querySelectorAll('a[href]')].slice(0, 40).map((link, index) => ({ title: clean(link.textContent || `Lien ${index + 1}`), href: link.getAttribute('href') || '#' }))
  if (type === 'studio_dialog') return [{ title: clean(element.querySelector('h1,h2,h3,h4,strong')?.textContent || 'Ouvrir'), body: clean(element.querySelector('p')?.textContent || element.textContent || '') }]
  if (type === 'studio_form') return [...element.querySelectorAll('input,select,textarea')].slice(0, 30).map((field, index) => ({ title: clean(field.getAttribute('name') || field.getAttribute('aria-label') || `Champ ${index + 1}`), value: field.tagName.toLowerCase(), description: field.getAttribute('type') || '' }))
  return []
}
