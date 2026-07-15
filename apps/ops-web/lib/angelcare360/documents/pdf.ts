import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'
import { getAngelcare360ConfidentialityLabel } from './a4-reference'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89

function text(value: unknown, fallback = '—') {
  const raw = value === null || value === undefined ? '' : String(value)
  const trimmed = raw.trim()
  return trimmed || fallback
}

function cleanFilePart(value: string) {
  const safe = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return safe || 'angelcare360-document'
}

function wrapText(font: any, value: string, size: number, maxWidth: number) {
  const paragraphs = String(value || '').split(/\r?\n/)
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }
    let current = words[0]
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${current} ${words[index]}`
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate
      } else {
        lines.push(current)
        current = words[index]
      }
    }
    lines.push(current)
  }
  return lines.length ? lines : ['']
}

function drawWrappedText(page: any, font: any, value: string, size: number, x: number, y: number, maxWidth: number, lineHeight: number, color = rgb(0.07, 0.12, 0.22)) {
  const lines = wrapText(font, value, size, maxWidth)
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color,
    })
  })
  return lines.length
}

function drawPill(page: any, font: any, label: string, x: number, y: number, width: number, fill: [number, number, number], color: [number, number, number]) {
  page.drawRectangle({
    x,
    y: y - 18,
    width,
    height: 20,
    color: rgb(fill[0], fill[1], fill[2]),
    borderColor: rgb(fill[0], fill[1], fill[2]),
    borderWidth: 1,
    radius: 8,
  })
  page.drawText(label, {
    x: x + 8,
    y: y - 5,
    size: 8.5,
    font,
    color: rgb(color[0], color[1], color[2]),
  })
}

export async function generateAngelcare360A4PdfBytes(model: Angelcare360A4DocumentModel) {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const margin = 30
  let cursorY = PAGE_HEIGHT - 36

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(1, 1, 1),
  })

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 112,
    width: PAGE_WIDTH,
    height: 112,
    color: rgb(0.93, 0.96, 1),
  })

  page.drawText('ANGELCARE 360', {
    x: margin,
    y: cursorY,
    size: 20,
    font: bold,
    color: rgb(0.07, 0.12, 0.22),
  })
  page.drawText(text(model.title), {
    x: margin,
    y: cursorY - 24,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.2, 0.48),
  })
  page.drawText(text(model.referenceCode), {
    x: PAGE_WIDTH - 180,
    y: cursorY,
    size: 12,
    font: bold,
    color: rgb(0.1, 0.2, 0.48),
  })
  page.drawText(`${text(model.family)} · ${text(model.version)}`, {
    x: PAGE_WIDTH - 180,
    y: cursorY - 18,
    size: 10,
    font: regular,
    color: rgb(0.28, 0.33, 0.45),
  })
  page.drawText(`Date: ${text(model.issueDate)}`, {
    x: PAGE_WIDTH - 180,
    y: cursorY - 34,
    size: 10,
    font: regular,
    color: rgb(0.28, 0.33, 0.45),
  })
  drawPill(
    page,
    bold,
    getAngelcare360ConfidentialityLabel(model.confidentiality),
    PAGE_WIDTH - 180,
    cursorY - 54,
    150,
    [0.92, 0.95, 1],
    [0.1, 0.2, 0.48],
  )

  cursorY -= 92

  const metaGrid = [
    ['Préparé par', text(model.preparedBy)],
    ['Client', text(model.clientName)],
    ['Tenant', text(model.tenantName)],
    ['Établissement', text(model.schoolName)],
    ['Sujet', text(model.subject)],
    ['Statut', text(model.statusLabel)],
  ].filter(([, value]) => value && value !== '—')

  const metaBoxHeight = Math.max(62, metaGrid.length * 16 + 20)
  page.drawRectangle({
    x: margin,
    y: cursorY - metaBoxHeight,
    width: PAGE_WIDTH - margin * 2,
    height: metaBoxHeight,
    borderColor: rgb(0.86, 0.89, 0.94),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  })

  page.drawText('INFORMATIONS CLÉS', {
    x: margin + 10,
    y: cursorY - 16,
    size: 9,
    font: bold,
    color: rgb(0.1, 0.2, 0.48),
  })

  let metaY = cursorY - 31
  metaGrid.forEach(([label, value]) => {
    page.drawText(`${label}:`, {
      x: margin + 10,
      y: metaY,
      size: 8.7,
      font: bold,
      color: rgb(0.26, 0.32, 0.45),
    })
    drawWrappedText(page, regular, value, 8.7, margin + 95, metaY, PAGE_WIDTH - margin * 2 - 105, 10.3, rgb(0.07, 0.12, 0.22))
    metaY -= 16
  })

  cursorY -= metaBoxHeight + 18

  if (model.metrics?.length) {
    const boxWidth = (PAGE_WIDTH - margin * 2 - 18) / 2
    model.metrics.forEach((metric, index) => {
      const x = margin + (index % 2) * (boxWidth + 18)
      const y = cursorY - Math.floor(index / 2) * 54
      page.drawRectangle({
        x,
        y: y - 42,
        width: boxWidth,
        height: 44,
        borderColor: rgb(0.87, 0.9, 0.95),
        borderWidth: 1,
        color: rgb(0.98, 0.99, 1),
      })
      page.drawText(metric.label, { x: x + 10, y: y - 12, size: 8.3, font: bold, color: rgb(0.32, 0.37, 0.49) })
      page.drawText(metric.value, { x: x + 10, y: y - 28, size: 12.5, font: bold, color: rgb(0.07, 0.12, 0.22) })
    })
    cursorY -= Math.ceil(model.metrics.length / 2) * 54 + 8
  }

  if (model.summaryLines?.length) {
    page.drawText('RÉSUMÉ', { x: margin, y: cursorY, size: 10, font: bold, color: rgb(0.1, 0.2, 0.48) })
    cursorY -= 15
    model.summaryLines.forEach((line) => {
      const height = drawWrappedText(page, regular, line, 9.4, margin, cursorY, PAGE_WIDTH - margin * 2, 12, rgb(0.13, 0.18, 0.28))
      cursorY -= height * 12 + 2
    })
    cursorY -= 8
  }

  if (model.sections?.length) {
    model.sections.forEach((section) => {
      page.drawText(section.title, { x: margin, y: cursorY, size: 10, font: bold, color: rgb(0.1, 0.2, 0.48) })
      cursorY -= 14
      section.lines.forEach((line) => {
        const height = drawWrappedText(page, regular, line, 9.2, margin, cursorY, PAGE_WIDTH - margin * 2, 11.5, rgb(0.13, 0.18, 0.28))
        cursorY -= height * 11.5 + 2
      })
      cursorY -= 8
    })
  }

  if (model.table?.headers?.length && model.table.rows.length) {
    const tableTop = cursorY
    const tableHeight = Math.min(220, 28 + model.table.rows.length * 22)
    page.drawRectangle({
      x: margin,
      y: tableTop - tableHeight,
      width: PAGE_WIDTH - margin * 2,
      height: tableHeight,
      borderColor: rgb(0.86, 0.89, 0.94),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    })
    const columnWidth = (PAGE_WIDTH - margin * 2) / model.table.headers.length
    model.table.headers.forEach((header, index) => {
      page.drawText(header, {
        x: margin + index * columnWidth + 8,
        y: tableTop - 16,
        size: 8.3,
        font: bold,
        color: rgb(0.1, 0.2, 0.48),
      })
    })
    let rowY = tableTop - 34
    model.table.rows.slice(0, 8).forEach((row) => {
      row.forEach((cell, index) => {
        drawWrappedText(page, regular, text(cell), 8.3, margin + index * columnWidth + 8, rowY, columnWidth - 12, 10, rgb(0.13, 0.18, 0.28))
      })
      rowY -= 22
    })
    cursorY = tableTop - tableHeight - 12
  }

  if (model.note) {
    page.drawText(text(model.note), {
      x: margin,
      y: cursorY,
      size: 8.8,
      font: regular,
      color: rgb(0.36, 0.41, 0.53),
    })
    cursorY -= 14
  }

  if (model.signatureLabel || model.signatureName) {
    page.drawRectangle({
      x: margin,
      y: 100,
      width: 210,
      height: 72,
      borderColor: rgb(0.86, 0.89, 0.94),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    })
    page.drawText(text(model.signatureLabel || 'Signature'), {
      x: margin + 10,
      y: 154,
      size: 9,
      font: bold,
      color: rgb(0.1, 0.2, 0.48),
    })
    page.drawText(text(model.signatureName || 'AngelCare 360'), {
      x: margin + 10,
      y: 132,
      size: 10,
      font: regular,
      color: rgb(0.13, 0.18, 0.28),
    })
  }

  page.drawLine({
    start: { x: margin, y: 74 },
    end: { x: PAGE_WIDTH - margin, y: 74 },
    color: rgb(0.84, 0.88, 0.95),
    thickness: 1,
  })
  page.drawText(`AngelCare 360 · ${text(model.referenceCode)} · ${text(model.confidentiality)}`, {
    x: margin,
    y: 54,
    size: 8.3,
    font: regular,
    color: rgb(0.36, 0.41, 0.53),
  })
  page.drawText(`Page 1/1 · ${text(model.footerNote || 'Document A4 prêt à l’impression.')}`, {
    x: PAGE_WIDTH - 240,
    y: 54,
    size: 8.3,
    font: regular,
    color: rgb(0.36, 0.41, 0.53),
  })

  const bytes = await pdf.save()
  return bytes
}

export function getAngelcare360A4PdfFilename(model: Angelcare360A4DocumentModel) {
  return `${cleanFilePart(model.referenceCode || model.templateKey)}.pdf`
}

