import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'
import { getAngelcare360ConfidentialityLabel } from './a4-reference'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 30
const CONTENT_BOTTOM = 92
const CONTENT_TOP = PAGE_HEIGHT - 126

function text(value: unknown, fallback = '—') {
  const raw = value === null || value === undefined ? '' : String(value)
  return raw.trim() || fallback
}

function cleanFilePart(value: string) {
  const safe = String(value || '').trim().replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return safe || 'sanila-document'
}

function allModelText(model: Angelcare360A4DocumentModel) {
  return [
    model.title, model.family, model.referenceCode, model.version, model.issueDate, model.preparedBy, model.subject,
    model.clientName, model.tenantName, model.schoolName, model.note, model.statusLabel, model.signatureLabel, model.signatureName,
    ...(model.summaryLines || []), ...(model.metadataLines || []).flatMap((row) => [row.label, row.value]),
    ...(model.metrics || []).flatMap((row) => [row.label, row.value]),
    ...(model.sections || []).flatMap((section) => [section.title, ...section.lines]),
    ...(model.table?.headers || []), ...(model.table?.rows || []).flat(), model.footerNote,
  ].filter(Boolean).join('\n')
}

function needsUnicodeFont(value: string) {
  return /[^\u0000-\u00ff]/.test(value)
}

async function resolveFonts(pdf: PDFDocument, model: Angelcare360A4DocumentModel) {
  const fullText = allModelText(model)
  const unicodePath = process.env.SANILA_PDF_UNICODE_FONT_PATH?.trim()
  if (needsUnicodeFont(fullText) && !unicodePath) {
    throw new Error('SANILA_PDF_UNICODE_FONT_REQUIRED: configure SANILA_PDF_UNICODE_FONT_PATH with an approved Unicode/Arabic-capable font on the server.')
  }
  if (unicodePath) {
    pdf.registerFontkit(fontkit)
    const bytes = await readFile(unicodePath)
    const regular = await pdf.embedFont(bytes, { subset: true })
    const boldPath = process.env.SANILA_PDF_UNICODE_BOLD_FONT_PATH?.trim()
    const bold = boldPath ? await pdf.embedFont(await readFile(boldPath), { subset: true }) : regular
    return { regular, bold, unicode: true }
  }
  return {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    unicode: false,
  }
}

function wrapText(font: PDFFont, value: string, size: number, maxWidth: number) {
  const paragraphs = String(value || '').split(/\r?\n/)
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) { lines.push(''); continue }
    let current = words[0]
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${current} ${words[index]}`
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate
      else { lines.push(current); current = words[index] }
    }
    if (font.widthOfTextAtSize(current, size) > maxWidth) {
      // Hard-break pathologically long tokens without dropping content.
      let buffer = ''
      for (const char of current) {
        if (font.widthOfTextAtSize(buffer + char, size) <= maxWidth) buffer += char
        else { if (buffer) lines.push(buffer); buffer = char }
      }
      if (buffer) lines.push(buffer)
    } else lines.push(current)
  }
  return lines.length ? lines : ['']
}

function drawWrappedText(page: PDFPage, font: PDFFont, value: string, size: number, x: number, y: number, maxWidth: number, lineHeight: number, color = rgb(0.07, 0.12, 0.22), maxLines?: number) {
  const all = wrapText(font, value, size, maxWidth)
  const lines = typeof maxLines === 'number' ? all.slice(0, maxLines) : all
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }))
  return { lines: lines.length, truncated: all.length > lines.length }
}

function drawPageBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(1, 1, 1) })
}

async function drawLogo(pdf: PDFDocument, page: PDFPage, x: number, y: number, bold: PDFFont) {
  try {
    const logoBytes = await readFile(path.join(process.cwd(), 'public', 'brand', 'sanila-official-logo.png'))
    const logo = await pdf.embedPng(logoBytes)
    const scale = Math.min(1, 118 / logo.width, 54 / logo.height)
    page.drawImage(logo, { x, y: y - 36, width: logo.width * scale, height: logo.height * scale })
  } catch {
    page.drawText('SANILA', { x, y, size: 20, font: bold, color: rgb(0.07, 0.12, 0.22) })
  }
}

function drawConfidentialityPill(page: PDFPage, font: PDFFont, label: string, x: number, y: number) {
  page.drawRectangle({ x, y: y - 17, width: 148, height: 19, color: rgb(0.92, 0.95, 1), borderColor: rgb(0.82, 0.87, 0.96), borderWidth: 1 })
  page.drawText(label, { x: x + 7, y: y - 5, size: 8, font, color: rgb(0.1, 0.2, 0.48) })
}

type RenderContext = { pdf: PDFDocument; regular: PDFFont; bold: PDFFont; model: Angelcare360A4DocumentModel; page: PDFPage; cursorY: number }

async function addContentPage(context: Omit<RenderContext, 'page' | 'cursorY'>, continuationLabel?: string): Promise<RenderContext> {
  const page = context.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  drawPageBackground(page)
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 90, width: PAGE_WIDTH, height: 90, color: rgb(0.965, 0.98, 1) })
  await drawLogo(context.pdf, page, MARGIN, PAGE_HEIGHT - 40, context.bold)
  page.drawText(text(context.model.referenceCode), { x: PAGE_WIDTH - 190, y: PAGE_HEIGHT - 40, size: 10.5, font: context.bold, color: rgb(0.1, 0.2, 0.48) })
  if (continuationLabel) page.drawText(continuationLabel, { x: MARGIN + 132, y: PAGE_HEIGHT - 50, size: 9, font: context.bold, color: rgb(0.28, 0.37, 0.52) })
  drawConfidentialityPill(page, context.bold, getAngelcare360ConfidentialityLabel(context.model.confidentiality), PAGE_WIDTH - 190, PAGE_HEIGHT - 61)
  return { ...context, page, cursorY: CONTENT_TOP }
}

async function ensureSpace(ctx: RenderContext, required: number, continuation?: string) {
  if (ctx.cursorY - required >= CONTENT_BOTTOM) return ctx
  return addContentPage(ctx, continuation || 'SUITE DU DOCUMENT')
}

function drawSectionHeading(ctx: RenderContext, title: string) {
  ctx.page.drawText(title.toUpperCase(), { x: MARGIN, y: ctx.cursorY, size: 9.6, font: ctx.bold, color: rgb(0.1, 0.2, 0.48) })
  ctx.cursorY -= 15
}

async function drawParagraph(ctx: RenderContext, value: string, options?: { size?: number; lineHeight?: number; color?: ReturnType<typeof rgb>; continuation?: string }) {
  const size = options?.size || 9.2
  const lineHeight = options?.lineHeight || 11.6
  const lines = wrapText(ctx.regular, value, size, PAGE_WIDTH - MARGIN * 2)
  for (const line of lines) {
    ctx = await ensureSpace(ctx, lineHeight + 3, options?.continuation)
    ctx.page.drawText(line, { x: MARGIN, y: ctx.cursorY, size, font: ctx.regular, color: options?.color || rgb(0.13, 0.18, 0.28) })
    ctx.cursorY -= lineHeight
  }
  return ctx
}

function measureTableRow(font: PDFFont, row: string[], widths: number[], size = 8.1, lineHeight = 9.6) {
  const counts = row.map((cell, index) => wrapText(font, text(cell), size, Math.max(30, widths[index] - 12)).length)
  return Math.max(22, Math.max(...counts, 1) * lineHeight + 10)
}

function drawTableHeader(ctx: RenderContext, headers: string[], widths: number[]) {
  const height = 24
  let x = MARGIN
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.cursorY - height + 5, width: PAGE_WIDTH - MARGIN * 2, height, color: rgb(0.94, 0.97, 1), borderColor: rgb(0.84, 0.89, 0.96), borderWidth: 1 })
  headers.forEach((header, index) => {
    drawWrappedText(ctx.page, ctx.bold, text(header), 7.7, x + 6, ctx.cursorY - 8, widths[index] - 12, 9, rgb(0.1, 0.2, 0.48), 2)
    x += widths[index]
  })
  ctx.cursorY -= height
}

async function drawTable(ctx: RenderContext, headers: string[], rows: string[][]) {
  const count = Math.max(headers.length, 1)
  const width = (PAGE_WIDTH - MARGIN * 2) / count
  const widths = headers.map(() => width)
  ctx = await ensureSpace(ctx, 60, 'TABLEAU — SUITE')
  drawTableHeader(ctx, headers, widths)
  for (const rawRow of rows) {
    const row = headers.map((_, index) => text(rawRow[index]))
    const rowHeight = measureTableRow(ctx.regular, row, widths)
    if (ctx.cursorY - rowHeight < CONTENT_BOTTOM) {
      ctx = await addContentPage(ctx, 'TABLEAU — SUITE')
      drawTableHeader(ctx, headers, widths)
    }
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.cursorY - rowHeight + 4, width: PAGE_WIDTH - MARGIN * 2, height: rowHeight, color: rgb(1, 1, 1), borderColor: rgb(0.89, 0.91, 0.95), borderWidth: 0.7 })
    let x = MARGIN
    row.forEach((cell, index) => {
      drawWrappedText(ctx.page, ctx.regular, cell, 8.1, x + 6, ctx.cursorY - 9, widths[index] - 12, 9.6, rgb(0.13, 0.18, 0.28))
      x += widths[index]
    })
    ctx.cursorY -= rowHeight
  }
  ctx.cursorY -= 10
  return ctx
}

function drawFooter(page: PDFPage, regular: PDFFont, model: Angelcare360A4DocumentModel, pageNo: number, total: number) {
  page.drawLine({ start: { x: MARGIN, y: 74 }, end: { x: PAGE_WIDTH - MARGIN, y: 74 }, color: rgb(0.84, 0.88, 0.95), thickness: 1 })
  page.drawText(`SANILA · ${text(model.referenceCode)} · ${getAngelcare360ConfidentialityLabel(model.confidentiality)}`, { x: MARGIN, y: 54, size: 7.9, font: regular, color: rgb(0.36, 0.41, 0.53) })
  const pageLabel = `Page ${pageNo}/${total}`
  const footer = text(model.footerNote || 'Document A4 prêt à l’impression.')
  page.drawText(`${pageLabel} · ${footer}`.slice(0, 84), { x: PAGE_WIDTH - 265, y: 54, size: 7.9, font: regular, color: rgb(0.36, 0.41, 0.53) })
}

export async function generateAngelcare360A4PdfBytes(model: Angelcare360A4DocumentModel) {
  const pdf = await PDFDocument.create()
  const { regular, bold } = await resolveFonts(pdf, model)
  let ctx = await addContentPage({ pdf, regular, bold, model })

  // First-page title authority.
  ctx.page.drawText(text(model.title), { x: MARGIN, y: ctx.cursorY, size: 18, font: bold, color: rgb(0.08, 0.18, 0.39) })
  ctx.cursorY -= 25
  ctx.page.drawText(`${text(model.family)} · ${text(model.version)} · ${text(model.issueDate)}`, { x: MARGIN, y: ctx.cursorY, size: 9, font: regular, color: rgb(0.32, 0.39, 0.51) })
  ctx.cursorY -= 20

  const meta = [
    ['Préparé par', model.preparedBy], ['Client', model.clientName], ['Tenant', model.tenantName], ['Établissement', model.schoolName], ['Sujet', model.subject], ['Statut', model.statusLabel],
    ...(model.metadataLines || []).map((item) => [item.label, item.value]),
  ].filter(([, value]) => text(value, '') !== '') as string[][]

  if (meta.length) {
    ctx = await ensureSpace(ctx, 42, 'INFORMATIONS CLÉS — SUITE')
    drawSectionHeading(ctx, 'Informations clés')
    for (const [label, value] of meta) {
      const lines = wrapText(regular, `${label}: ${text(value)}`, 8.7, PAGE_WIDTH - MARGIN * 2)
      for (const line of lines) {
        ctx = await ensureSpace(ctx, 12, 'INFORMATIONS CLÉS — SUITE')
        ctx.page.drawText(line, { x: MARGIN, y: ctx.cursorY, size: 8.7, font: regular, color: rgb(0.18, 0.25, 0.37) })
        ctx.cursorY -= 11
      }
    }
    ctx.cursorY -= 6
  }

  if (model.metrics?.length) {
    drawSectionHeading(ctx, 'Indicateurs')
    for (const metric of model.metrics) {
      ctx = await ensureSpace(ctx, 34, 'INDICATEURS — SUITE')
      ctx.page.drawRectangle({ x: MARGIN, y: ctx.cursorY - 26, width: PAGE_WIDTH - MARGIN * 2, height: 29, color: rgb(0.98, 0.99, 1), borderColor: rgb(0.87, 0.9, 0.95), borderWidth: 1 })
      ctx.page.drawText(text(metric.label), { x: MARGIN + 9, y: ctx.cursorY - 9, size: 8.1, font: bold, color: rgb(0.33, 0.39, 0.5) })
      ctx.page.drawText(text(metric.value), { x: PAGE_WIDTH - MARGIN - 160, y: ctx.cursorY - 9, size: 10.5, font: bold, color: rgb(0.08, 0.17, 0.32) })
      ctx.cursorY -= 34
    }
  }

  if (model.summaryLines?.length) {
    ctx = await ensureSpace(ctx, 28, 'RÉSUMÉ — SUITE')
    drawSectionHeading(ctx, 'Résumé')
    for (const line of model.summaryLines) ctx = await drawParagraph(ctx, line, { continuation: 'RÉSUMÉ — SUITE' })
    ctx.cursorY -= 6
  }

  for (const section of model.sections || []) {
    ctx = await ensureSpace(ctx, 30, `${section.title.toUpperCase()} — SUITE`)
    drawSectionHeading(ctx, section.title)
    for (const line of section.lines) ctx = await drawParagraph(ctx, line, { continuation: `${section.title.toUpperCase()} — SUITE` })
    ctx.cursorY -= 6
  }

  if (model.table?.headers?.length && model.table.rows.length) {
    ctx = await ensureSpace(ctx, 40, 'TABLEAU — SUITE')
    drawSectionHeading(ctx, 'Détail')
    ctx = await drawTable(ctx, model.table.headers, model.table.rows)
  }

  if (model.note) {
    ctx = await ensureSpace(ctx, 34, 'NOTE — SUITE')
    drawSectionHeading(ctx, 'Note')
    ctx = await drawParagraph(ctx, model.note, { size: 8.7, lineHeight: 11, color: rgb(0.36, 0.41, 0.53), continuation: 'NOTE — SUITE' })
  }

  if (model.signatureLabel || model.signatureName) {
    ctx = await ensureSpace(ctx, 86, 'SIGNATURE — SUITE')
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.cursorY - 70, width: 220, height: 72, borderColor: rgb(0.86, 0.89, 0.94), borderWidth: 1, color: rgb(1, 1, 1) })
    ctx.page.drawText(text(model.signatureLabel || 'Signature'), { x: MARGIN + 10, y: ctx.cursorY - 17, size: 9, font: bold, color: rgb(0.1, 0.2, 0.48) })
    ctx.page.drawText(text(model.signatureName || 'SANILA'), { x: MARGIN + 10, y: ctx.cursorY - 40, size: 10, font: regular, color: rgb(0.13, 0.18, 0.28) })
    ctx.cursorY -= 82
  }

  const pages = pdf.getPages()
  pages.forEach((page, index) => drawFooter(page, regular, model, index + 1, pages.length))
  return pdf.save()
}

export function getAngelcare360A4PdfFilename(model: Angelcare360A4DocumentModel) {
  return `${cleanFilePart(model.referenceCode || model.templateKey)}.pdf`
}
