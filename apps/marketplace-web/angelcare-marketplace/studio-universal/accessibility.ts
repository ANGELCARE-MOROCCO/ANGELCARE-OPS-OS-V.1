'use client'

import type { StudioAccessibilityReport, StudioSeoEvidence, StudioShellEvidence } from './types'

const clean = (value: string) => value.replace(/\s+/g, ' ').trim()

export function analyzeStudioAccessibility(doc: Document): StudioAccessibilityReport {
  const issues: StudioAccessibilityReport['issues'] = []
  const images = [...doc.querySelectorAll('img')]
  const missingAlt = images.filter(image => !image.hasAttribute('alt'))
  if (missingAlt.length) issues.push({ code: 'IMG_ALT_MISSING', severity: 'warning', count: missingAlt.length, note: 'Images sans attribut alt.' })

  const controls = [...doc.querySelectorAll('input,select,textarea')]
  const unlabeled = controls.filter(control => {
    const id = control.getAttribute('id')
    const aria = control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')
    return !aria && !(id && doc.querySelector(`label[for="${CSS.escape(id)}"]`)) && !control.closest('label')
  })
  if (unlabeled.length) issues.push({ code: 'FORM_LABEL_MISSING', severity: 'critical', count: unlabeled.length, note: 'Champs de formulaire sans libellé accessible.' })

  const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(node => Number(node.tagName.slice(1)))
  let headingJumps = 0
  for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) headingJumps++
  if (headingJumps) issues.push({ code: 'HEADING_LEVEL_JUMP', severity: 'warning', count: headingJumps, note: 'Sauts de niveaux de titres détectés.' })

  const duplicateIds = [...doc.querySelectorAll('[id]')].map(node => node.id).filter((id, index, all) => id && all.indexOf(id) !== index)
  if (duplicateIds.length) issues.push({ code: 'DUPLICATE_ID', severity: 'critical', count: new Set(duplicateIds).size, note: 'Identifiants DOM dupliqués.' })

  const interactiveWithoutName = [...doc.querySelectorAll('button,a[href]')].filter(node => !clean(node.textContent || '') && !node.getAttribute('aria-label') && !node.getAttribute('title'))
  if (interactiveWithoutName.length) issues.push({ code: 'INTERACTIVE_NAME_MISSING', severity: 'critical', count: interactiveWithoutName.length, note: 'Actions sans nom accessible.' })

  const language = doc.documentElement.getAttribute('lang') || null
  const direction = doc.documentElement.getAttribute('dir') || null
  if (!language) issues.push({ code: 'LANG_MISSING', severity: 'warning', count: 1, note: 'Langue du document absente.' })

  const critical = issues.filter(issue => issue.severity === 'critical').reduce((sum, issue) => sum + issue.count, 0)
  const warnings = issues.filter(issue => issue.severity === 'warning').reduce((sum, issue) => sum + issue.count, 0)
  const score = Math.max(0, 100 - critical * 14 - warnings * 4)
  return { score, critical, warnings, language, direction, issues }
}

export function analyzeStudioSeo(doc: Document): StudioSeoEvidence {
  const title = clean(doc.querySelector('title')?.textContent || '')
  const description = clean(doc.querySelector('meta[name="description"]')?.getAttribute('content') || '')
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
  const h1Count = doc.querySelectorAll('h1').length
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
  const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
  const jsonLdCount = doc.querySelectorAll('script[type="application/ld+json"]').length
  return { title, description, canonical, robots, h1Count, ogTitle, ogDescription, jsonLdCount }
}

export function analyzeStudioShell(doc: Document): StudioShellEvidence {
  const header = Boolean(doc.querySelector('body > header, main > header, header[role="banner"]'))
  const navigation = Boolean(doc.querySelector('nav, [role="navigation"]'))
  const footer = Boolean(doc.querySelector('body > footer, main > footer, footer[role="contentinfo"]'))
  return {
    detected: header || navigation || footer,
    header,
    navigation,
    footer,
    defaultPolicy: 'preserve-global-shell',
    allowedPolicies: ['preserve-global-shell','page-local','promote-header','promote-navigation','promote-footer'],
  }
}
