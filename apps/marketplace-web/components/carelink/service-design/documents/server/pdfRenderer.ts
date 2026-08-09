import 'server-only'

import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import { getServiceDocumentTemplate, SERVICE_DOCUMENT_SECTION_LABELS } from '../templateRegistry'
import type { ServiceDocumentRenderPayload, ServiceDocumentSectionKey } from '../types'

const A4_PORTRAIT: [number, number] = [595.28, 841.89]
const A4_LANDSCAPE: [number, number] = [841.89, 595.28]
const LOGO_PATH = path.join(process.cwd(), 'public', 'b2b-plaquette-partenaires', 'assets', 'angelcare-original-logo.png')

const safe = (value: unknown) => String(value ?? '').replace(/[\u2018\u2019]/g, "'").replace(/[\u2190-\u21ff]/g, '-').replace(/[\u2022]/g, '•').replace(/[\u2013\u2014]/g, '-').replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF•]/g, '')
const money = (value?: number | null, currency = 'Dh') => value === null || value === undefined ? 'Sur devis' : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} ${currency}`
const hex = (value: string) => {
  const normalized = value.replace('#', '')
  const parsed = Number.parseInt(normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized, 16)
  return rgb(((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255)
}

interface DrawContext {
  pdf: PDFDocument
  page: PDFPage
  regular: PDFFont
  bold: PDFFont
  logo?: PDFImage
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
  y: number
  accent: ReturnType<typeof rgb>
  accentSoft: ReturnType<typeof rgb>
  payload: ServiceDocumentRenderPayload
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = safe(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate
    else {
      if (current) lines.push(current)
      if (font.widthOfTextAtSize(word, size) <= maxWidth) current = word
      else {
        let slice = ''
        for (const char of word) {
          const next = slice + char
          if (font.widthOfTextAtSize(next, size) <= maxWidth) slice = next
          else { if (slice) lines.push(slice); slice = char }
        }
        current = slice
      }
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function drawHeader(ctx: DrawContext) {
  const { page, width, height, left, right, bold, regular, payload, accent, logo } = ctx
  if (payload.settings.showLogo && logo) {
    const scale = Math.min(130 / logo.width, 34 / logo.height)
    page.drawImage(logo, { x: left, y: height - 55, width: logo.width * scale, height: logo.height * scale })
  }
  const textX = payload.settings.showLogo && logo ? left + 145 : left
  page.drawText('ANGELCARE · SERVICE DESIGN OS', { x: textX, y: height - 29, size: 7.5, font: bold, color: accent })
  page.drawText(safe(payload.settings.documentTitle || payload.source.title), { x: textX, y: height - 46, size: 16, font: bold, color: rgb(.05, .11, .19), maxWidth: width - textX - right - 150 })
  const template = getServiceDocumentTemplate(payload.settings.templateId)
  page.drawText(`${template.name} · ${template.code}`, { x: textX, y: height - 59, size: 7.5, font: regular, color: rgb(.35, .41, .48) })
  const confidentiality = payload.settings.confidentiality.toUpperCase()
  const badgeWidth = Math.max(65, bold.widthOfTextAtSize(confidentiality, 7) + 18)
  page.drawRectangle({ x: width - right - badgeWidth, y: height - 40, width: badgeWidth, height: 17, color: accent })
  page.drawText(confidentiality, { x: width - right - badgeWidth + 9, y: height - 34.5, size: 7, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`Réf. ${safe(payload.settings.documentReference || payload.source.reference || payload.source.code || payload.source.sourceId || 'À attribuer')}`, { x: width - right - 150, y: height - 56, size: 7.2, font: bold, color: rgb(.35, .41, .48), maxWidth: 150 })
  page.drawLine({ start: { x: left, y: height - 70 }, end: { x: width - right, y: height - 70 }, thickness: .7, color: rgb(.83, .87, .91) })
}

function newPage(base: Omit<DrawContext, 'page' | 'y'>): DrawContext {
  const page = base.pdf.addPage([base.width, base.height])
  const ctx: DrawContext = { ...base, page, y: base.height - 88 }
  drawHeader(ctx)
  return ctx
}

function ensure(ctx: DrawContext, height: number) {
  if (ctx.y - height >= ctx.bottom + 35) return ctx
  const { page: _page, y: _y, ...base } = ctx
  return newPage(base)
}

function textLines(ctx: DrawContext, value: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; width?: number; leading?: number; indent?: number } = {}) {
  const size = options.size ?? 9
  const font = options.font ?? ctx.regular
  const width = options.width ?? ctx.width - ctx.left - ctx.right
  const leading = options.leading ?? size * 1.35
  const lines = wrap(font, value, size, width)
  let current = ensure(ctx, lines.length * leading + 3)
  lines.forEach((line) => {
    current.page.drawText(line, { x: current.left + (options.indent || 0), y: current.y, size, font, color: options.color || rgb(.16, .22, .29) })
    current.y -= leading
  })
  current.y -= 2
  return current
}

function sectionTitle(ctx: DrawContext, title: string) {
  let current = ensure(ctx, 28)
  current.page.drawRectangle({ x: current.left, y: current.y - 3, width: current.width - current.left - current.right, height: 21, color: current.accentSoft })
  current.page.drawRectangle({ x: current.left, y: current.y - 3, width: 4, height: 21, color: current.accent })
  current.page.drawText(safe(title.toUpperCase()), { x: current.left + 11, y: current.y + 4, size: 8, font: current.bold, color: current.accent })
  current.y -= 29
  return current
}

function bulletList(ctx: DrawContext, values: string[], empty: string) {
  if (!values.length) return textLines(ctx, empty, { size: 8.2, color: rgb(.48, .53, .59) })
  let current = ctx
  values.forEach((value) => {
    current = ensure(current, 18)
    current.page.drawCircle({ x: current.left + 3, y: current.y + 3, size: 2, color: current.accent })
    current = textLines(current, value, { size: 8.4, width: current.width - current.left - current.right - 16, indent: 12, leading: 11.5 })
  })
  return current
}

function keyValueGrid(ctx: DrawContext, entries: Array<[string, unknown]>, columns = 4) {
  let current = ctx
  const gap = 8
  const cellWidth = (current.width - current.left - current.right - gap * (columns - 1)) / columns
  const rows = Math.ceil(entries.length / columns)
  for (let row = 0; row < rows; row += 1) {
    current = ensure(current, 46)
    for (let col = 0; col < columns; col += 1) {
      const entry = entries[row * columns + col]
      if (!entry) continue
      const x = current.left + col * (cellWidth + gap)
      current.page.drawRectangle({ x, y: current.y - 30, width: cellWidth, height: 37, color: rgb(.97, .98, .99), borderColor: rgb(.86, .89, .92), borderWidth: .4 })
      current.page.drawText(safe(entry[0].toUpperCase()), { x: x + 7, y: current.y - 3, size: 6.4, font: current.bold, color: rgb(.45, .5, .56) })
      const value = safe(entry[1] || 'Non renseigné')
      const line = wrap(current.bold, value, 8, cellWidth - 14).slice(0, 2)
      line.forEach((text, index) => current.page.drawText(text, { x: x + 7, y: current.y - 15 - index * 9, size: 8, font: current.bold, color: rgb(.1, .15, .21) }))
    }
    current.y -= 46
  }
  current.y -= 4
  return current
}

function drawIdentity(ctx: DrawContext) {
  const s = ctx.payload.source
  let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS.identity)
  current = keyValueGrid(current, [['Référence', s.reference || s.code], ['Version', s.version], ['Statut', s.status], ['Catégorie', s.category], ['Univers', s.universe], ['Période', [s.dateFrom, s.dateTo].filter(Boolean).join(' - ')], ['Responsable', s.owner], ['Approbateur', s.approver]], ctx.payload.settings.orientation === 'landscape' ? 4 : 2)
  return current
}

function drawTwoLists(ctx: DrawContext, title: string, leftLabel: string, left: string[], rightLabel: string, right: string[]) {
  let current = sectionTitle(ctx, title)
  current = ensure(current, 28)
  const gap = 14
  const columnWidth = (current.width - current.left - current.right - gap) / 2
  const x1 = current.left
  const x2 = current.left + columnWidth + gap
  current.page.drawText(leftLabel.toUpperCase(), { x: x1, y: current.y, size: 7, font: current.bold, color: current.accent })
  current.page.drawText(rightLabel.toUpperCase(), { x: x2, y: current.y, size: 7, font: current.bold, color: current.accent })
  current.y -= 14
  const startY = current.y
  let leftCtx = { ...current, right: current.width - x1 - columnWidth }
  leftCtx = bulletList(leftCtx, left, 'Aucune donnée enregistrée.')
  let rightCtx = { ...current, left: x2, right: current.right }
  rightCtx = bulletList(rightCtx, right, 'Aucune donnée enregistrée.')
  current.y = Math.min(leftCtx.y, rightCtx.y, startY - 16)
  return current
}

function drawTimeline(ctx: DrawContext) {
  let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS.timeline)
  const days = ctx.payload.source.days
  if (!days.length) return textLines(current, 'Aucun bloc horaire résolu. Le document ne fabrique aucune timeline.', { size: 8.4, color: rgb(.48, .53, .59) })
  days.forEach((day, dayIndex) => {
    current = ensure(current, 42)
    current.page.drawRectangle({ x: current.left, y: current.y - 4, width: current.width - current.left - current.right, height: 28, color: current.accentSoft })
    current.page.drawText(safe((day.label || `Jour ${dayIndex + 1}`).toUpperCase()), { x: current.left + 9, y: current.y + 10, size: 7.5, font: current.bold, color: current.accent })
    current.page.drawText(safe(`${day.date || 'Date non renseignée'} · ${day.objective || ''}`), { x: current.left + 9, y: current.y, size: 7.5, font: current.regular, color: rgb(.25, .31, .38) })
    current.page.drawText(safe(`${day.start || '--:--'} - ${day.end || '--:--'}`), { x: current.width - current.right - 92, y: current.y + 4, size: 8.2, font: current.bold, color: current.accent, maxWidth: 86 })
    current.y -= 37
    if (!day.blocks.length) current = textLines(current, 'Aucun bloc structuré pour cette journée.', { size: 8.2 })
    day.blocks.forEach((block) => {
      current = ensure(current, 34)
      current.page.drawLine({ start: { x: current.left, y: current.y + 8 }, end: { x: current.width - current.right, y: current.y + 8 }, thickness: .35, color: rgb(.88, .9, .92) })
      current.page.drawText(safe(block.start || '--:--'), { x: current.left, y: current.y - 4, size: 7.5, font: current.bold, color: current.accent })
      current.page.drawText(safe(block.title), { x: current.left + 58, y: current.y - 2, size: 8.4, font: current.bold, color: rgb(.1, .15, .21), maxWidth: current.width - current.left - current.right - 150 })
      const detail = safe(block.detail || block.activityCode || block.type || 'Bloc structuré')
      const detailLines = wrap(current.regular, detail, 7.2, current.width - current.left - current.right - 150).slice(0, 2)
      detailLines.forEach((line, index) => current.page.drawText(line, { x: current.left + 58, y: current.y - 13 - index * 9, size: 7.2, font: current.regular, color: rgb(.42, .47, .53) }))
      current.page.drawText(safe(block.end || '--:--'), { x: current.width - current.right - 42, y: current.y - 4, size: 7.2, font: current.bold, color: rgb(.4, .45, .5), maxWidth: 42 })
      current.y -= 32 + Math.max(0, detailLines.length - 1) * 8
    })
    current.y -= 6
  })
  return current
}

function drawPricing(ctx: DrawContext) {
  let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS.pricing_economics)
  const lines = ctx.payload.source.priceLines
  current = ensure(current, 28)
  const cols = [current.left, current.width - current.right - 245, current.width - current.right - 175, current.width - current.right - 90]
  ;['Désignation', 'Qté', 'P.U', 'Total'].forEach((label, index) => current.page.drawText(label.toUpperCase(), { x: cols[index], y: current.y, size: 6.7, font: current.bold, color: current.accent }))
  current.y -= 13
  if (!lines.length) current = textLines(current, 'Aucune ligne tarifaire résolue. Le document affiche Sur devis au lieu d’inventer un prix.', { size: 8.2 })
  lines.forEach((line) => {
    current = ensure(current, 22)
    current.page.drawLine({ start: { x: current.left, y: current.y + 6 }, end: { x: current.width - current.right, y: current.y + 6 }, thickness: .3, color: rgb(.88, .9, .92) })
    current.page.drawText(safe(line.label), { x: cols[0], y: current.y - 4, size: 7.7, font: current.regular, color: rgb(.15, .2, .26), maxWidth: cols[1] - cols[0] - 8 })
    current.page.drawText(String(line.quantity ?? 1), { x: cols[1], y: current.y - 4, size: 7.7, font: current.regular, color: rgb(.15, .2, .26) })
    current.page.drawText(money(line.unitPrice, ctx.payload.source.currency), { x: cols[2], y: current.y - 4, size: 7.7, font: current.regular, color: rgb(.15, .2, .26), maxWidth: 78 })
    current.page.drawText(money(line.total, ctx.payload.source.currency), { x: cols[3], y: current.y - 4, size: 7.7, font: current.bold, color: rgb(.1, .15, .21), maxWidth: 88 })
    current.y -= 20
  })
  current = ensure(current, 68)
  const boxX = current.width - current.right - 230
  current.page.drawRectangle({ x: boxX, y: current.y - 52, width: 230, height: 58, color: rgb(.05, .09, .15) })
  const totals: Array<[string, string]> = [['Total client', money(ctx.payload.source.total, ctx.payload.source.currency)], ['Coût', money(ctx.payload.source.cost, ctx.payload.source.currency)], ['Marge', ctx.payload.source.margin == null ? 'Non renseignée' : `${ctx.payload.source.margin}%`]]
  totals.forEach(([label, value], index) => { current.page.drawText(label, { x: boxX + 12, y: current.y - 9 - index * 15, size: 7.4, font: current.regular, color: rgb(.72, .76, .81) }); current.page.drawText(value, { x: boxX + 120, y: current.y - 9 - index * 15, size: 8.2, font: current.bold, color: rgb(1, 1, 1), maxWidth: 96 }) })
  current.y -= 65
  return current
}

function drawGenericSection(ctx: DrawContext, key: ServiceDocumentSectionKey) {
  const s = ctx.payload.source
  if (key === 'executive_summary') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); return textLines(current, s.executiveSummary || s.promise || 'Synthèse non renseignée.', { size: 9, leading: 13 }) }
  if (key === 'identity') return drawIdentity(ctx)
  if (key === 'customer_beneficiary') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); return keyValueGrid(current, [['Client', s.customerName], ['Type client', s.customerType], ['Bénéficiaire', s.beneficiaryName], ['Profil', s.beneficiaryProfile], ['Lieu', s.location], ['Univers', s.universe]], ctx.payload.settings.orientation === 'landscape' ? 3 : 2) }
  if (key === 'objectives_outcomes') { let current = drawTwoLists(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key], 'Objectifs', s.objectives, 'Résultats attendus', s.outcomes); if (s.painPoints.length) { current = textLines(current, 'ENJEUX / POINTS DE DOULEUR', { size: 7, font: current.bold, color: current.accent }); current = bulletList(current, s.painPoints, '') } return current }
  if (key === 'timeline') return drawTimeline(ctx)
  if (key === 'multi_day_progression') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); if (!s.days.length) return textLines(current, 'Aucune progression multi-jours disponible.', { size: 8.2 }); s.days.forEach((day, index) => { current = ensure(current, 27); current.page.drawText(`J${index + 1}`, { x: current.left, y: current.y, size: 8, font: current.bold, color: current.accent }); current.page.drawText(safe(day.label || day.date || `Jour ${index + 1}`), { x: current.left + 30, y: current.y, size: 8, font: current.bold, color: rgb(.1, .15, .21) }); current.page.drawText(safe(day.phase || day.objective || ''), { x: current.left + 190, y: current.y, size: 7.5, font: current.regular, color: rgb(.42, .47, .53), maxWidth: current.width - current.left - current.right - 190 }); current.y -= 22 }); return current }
  if (key === 'activities_materials') return drawTwoLists(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key], 'Activités', s.activities, 'Matériels', s.materials)
  if (key === 'staffing_competencies') return drawTwoLists(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key], 'Staffing', s.staffing, 'Compétences', s.competencies)
  if (key === 'safety_risks') return drawTwoLists(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key], 'Contrôles & safeguarding', s.safeguards, 'Risques', s.risks)
  if (key === 'checklists_reporting') return drawTwoLists(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key], 'Checklists', s.checklists, 'Reporting', s.reporting)
  if (key === 'route_transport') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); return bulletList(current, s.routes, 'Aucun parcours ou transport enregistré.') }
  if (key === 'commercial_package') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); current = textLines(current, s.promise || 'Promesse client non renseignée.', { size: 9, font: current.bold, color: current.accent }); current = bulletList(current, s.routines, 'Aucune option ou routine enregistrée.'); return current }
  if (key === 'pricing_economics') return drawPricing(ctx)
  if (key === 'deployment_sites') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); if (!s.sites.length) return textLines(current, 'Aucun site de déploiement enregistré.', { size: 8.2 }); s.sites.forEach((site) => { current = ensure(current, 24); current.page.drawText(safe(site.name), { x: current.left, y: current.y, size: 8, font: current.bold, color: rgb(.1, .15, .21) }); current.page.drawText(safe(site.city || 'Ville non renseignée'), { x: current.left + 180, y: current.y, size: 7.4, font: current.regular, color: rgb(.42, .47, .53) }); current.page.drawText(`${site.beneficiaries ?? '—'} bénéfic.`, { x: current.left + 300, y: current.y, size: 7.4, font: current.regular, color: rgb(.42, .47, .53) }); current.page.drawText(safe(site.serviceWindow || ''), { x: current.width - current.right - 130, y: current.y, size: 7.4, font: current.bold, color: current.accent, maxWidth: 130 }); current.y -= 20 }); return current }
  if (key === 'quality_readiness') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); if (!s.metrics.length && !s.warnings.length) return textLines(current, 'Aucun indicateur probant disponible.', { size: 8.2 }); current = keyValueGrid(current, s.metrics.map((metric): [string, unknown] => [metric.label, metric.value]), ctx.payload.settings.orientation === 'landscape' ? 4 : 2); if (s.warnings.length) current = bulletList(current, s.warnings, ''); return current }
  if (key === 'lineage_approvals') { let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key]); current = keyValueGrid(current, s.lineage.map((item): [string, unknown] => [item.label, item.value]).concat([['Source', `${s.sourceKind} · ${s.sourceId || s.code || 'non résolue'}`] as [string, unknown]]), ctx.payload.settings.orientation === 'landscape' ? 4 : 2); if (s.approvals.length) { current = textLines(current, 'VALIDATIONS ENREGISTRÉES', { size: 7, font: current.bold, color: current.accent }); s.approvals.forEach((approval) => { current = textLines(current, `${approval.authority || 'Autorité'} · ${approval.decision || 'Décision'} · ${approval.date || 'Date non renseignée'}${approval.note ? ` · ${approval.note}` : ''}`, { size: 8 }) }) } if (ctx.payload.settings.showBlankApprovalFields) { current = ensure(current, 54); current.page.drawRectangle({ x: current.left, y: current.y - 38, width: (current.width - current.left - current.right - 12) / 2, height: 44, borderColor: rgb(.72, .76, .81), borderWidth: .5 }); current.page.drawText('VALIDATION / NOM / DATE', { x: current.left + 8, y: current.y - 5, size: 6.5, font: current.bold, color: rgb(.45, .5, .56) }); const x2 = current.left + (current.width - current.left - current.right + 12) / 2; current.page.drawRectangle({ x: x2, y: current.y - 38, width: (current.width - current.left - current.right - 12) / 2, height: 44, borderColor: rgb(.72, .76, .81), borderWidth: .5 }); current.page.drawText('OBSERVATIONS', { x: x2 + 8, y: current.y - 5, size: 6.5, font: current.bold, color: rgb(.45, .5, .56) }); current.y -= 52 } return current }
  let current = sectionTitle(ctx, SERVICE_DOCUMENT_SECTION_LABELS[key])
  return bulletList(current, s.notes, 'Aucune note ou annexe enregistrée.')
}

function drawFooters(pdf: PDFDocument, payload: ServiceDocumentRenderPayload, regular: PDFFont, bold: PDFFont, accent: ReturnType<typeof rgb>, pageSize: [number, number]) {
  const pages = pdf.getPages()
  pages.forEach((page, index) => {
    const [width] = pageSize
    const left = 34
    const right = 34
    page.drawLine({ start: { x: left, y: 28 }, end: { x: width - right, y: 28 }, thickness: .45, color: rgb(.82, .86, .9) })
    if (payload.settings.showLegalFooter) {
      page.drawText('ANGELCARE UNITÉ D’AFFAIRE ARTAB S.A.R.L (A.U)', { x: left, y: 18, size: 5.7, font: bold, color: rgb(.22, .27, .32) })
      page.drawText('www.angelcarehub.com · backoffice@angelcarehub.com · +212 537 581 462', { x: left, y: 10, size: 5.5, font: regular, color: rgb(.42, .47, .52) })
    }
    const ref = safe(payload.settings.documentReference || payload.source.reference || payload.source.code || payload.source.sourceId || 'À attribuer')
    page.drawText(`${payload.settings.confidentiality.toUpperCase()} · Réf. ${ref}`, { x: width - right - 180, y: 18, size: 5.7, font: bold, color: accent, maxWidth: 180 })
    page.drawText(`Page ${index + 1} / ${pages.length}`, { x: width - right - 60, y: 10, size: 5.7, font: bold, color: rgb(.32, .37, .42), maxWidth: 60 })
  })
}

export async function renderServiceDesignPdf(payload: ServiceDocumentRenderPayload) {
  const template = getServiceDocumentTemplate(payload.settings.templateId)
  const pageSize = payload.settings.orientation === 'landscape' ? A4_LANDSCAPE : A4_PORTRAIT
  const pdf = await PDFDocument.create()
  pdf.setTitle(safe(payload.settings.documentTitle || payload.source.title))
  pdf.setAuthor('ANGELCARE Service Design OS')
  pdf.setSubject(`${template.name} · ${payload.source.sourceKind}`)
  pdf.setKeywords(['ANGELCARE', 'Service Design OS', template.code, payload.source.category || '', payload.source.reference || ''].filter(Boolean))
  pdf.setCreator('ANGELCARE Service Design A4 & PDF Production Studio')
  pdf.setProducer('pdf-lib')
  pdf.setCreationDate(new Date())
  pdf.setModificationDate(new Date())
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  let logo: PDFImage | undefined
  try { logo = await pdf.embedPng(await readFile(LOGO_PATH)) } catch { logo = undefined }
  const accent = hex(template.accent)
  const accentSoft = hex(template.accentSoft)
  const [width, height] = pageSize
  let ctx = newPage({ pdf, regular, bold, logo, width, height, left: 34, right: 34, top: 88, bottom: 34, accent, accentSoft, payload })
  const activeSections = payload.settings.sectionOrder.filter((key) => !payload.settings.hiddenSections.includes(key))
  for (const key of activeSections) {
    ctx = drawGenericSection(ctx, key)
    ctx.y -= payload.settings.density === 'compact' ? 4 : payload.settings.density === 'detailed' ? 12 : 8
  }
  drawFooters(pdf, payload, regular, bold, accent, pageSize)
  return pdf.save({ useObjectStreams: true, addDefaultPage: false })
}
