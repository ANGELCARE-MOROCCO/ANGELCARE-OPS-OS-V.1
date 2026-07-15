import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { formatMoney } from './calculations'
import {
  PACOJACO_COMPANY_BOX_ENTRIES,
  PACOJACO_FOOTER_SIGNATURE_LINES,
  buildPacojacoInterventionDisplayRows,
  buildPacojacoPrintableDocument,
  getPacojacoDisplayedTotals,
  pacojacoDocumentPrintLabel,
} from './presentation'
import type { PacojacoDocumentRow } from './types'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_Y = 28

function cleanText(value: any, fallback = '—') {
  const text = value == null ? '' : String(value)
  const trimmed = text.trim()
  return trimmed || fallback
}

function cleanFilename(value: string) {
  const safe = String(value || 'pacojaco-document')
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return safe || 'pacojaco-document'
}

function wrapText(font: any, text: string, size: number, maxWidth: number) {
  const raw = String(text || '').trim()
  if (!raw) return ['']
  const paragraphs = raw.split(/\r?\n/)
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }

    let current = words[0]
    for (let index = 1; index < words.length; index += 1) {
      const next = `${current} ${words[index]}`
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next
      } else {
        lines.push(current)
        current = words[index]
      }
    }
    lines.push(current)
  }

  return lines.length ? lines : ['']
}

function drawWrappedLines(page: any, font: any, text: string, size: number, x: number, y: number, maxWidth: number, lineHeight: number, color = rgb(0.1, 0.13, 0.2)) {
  const lines = wrapText(font, text, size, maxWidth)
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

function measureTextHeight(font: any, text: string, size: number, maxWidth: number, lineHeight: number) {
  return wrapText(font, text, size, maxWidth).length * lineHeight
}

function drawRoundedBox(page: any, x: number, y: number, width: number, height: number, color: [number, number, number], border = rgb(0.84, 0.87, 0.92)) {
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: border,
    borderWidth: 1,
    color: rgb(color[0], color[1], color[2]),
  })
}

function drawKeyValueBox(
  page: any,
  font: any,
  boldFont: any,
  title: string,
  entries: Array<[string, string | null | undefined]>,
  x: number,
  y: number,
  width: number
) {
  const lineHeight = 12
  const titleHeight = 14
  const bodyMaxWidth = width - 22
  let contentHeight = 12
  entries.forEach(([key, value]) => {
    const text = `${key}: ${cleanText(value)}`
    contentHeight += Math.max(lineHeight, measureTextHeight(font, text, 9.2, bodyMaxWidth, 11) + 3)
  })

  const boxHeight = Math.max(72, titleHeight + contentHeight + 18)
  drawRoundedBox(page, x, y, width, boxHeight, [1, 1, 1])

  page.drawText(title, {
    x: x + 10,
    y: y - 16,
    size: 9,
    font: boldFont,
    color: rgb(0.1, 0.33, 0.82),
  })

  let cursorY = y - 32
  for (const [key, value] of entries) {
    const line = `${key}: ${cleanText(value)}`
    const lines = wrapText(font, line, 9.2, bodyMaxWidth)
    page.drawText(lines.join('\n'), {
      x: x + 10,
      y: cursorY,
      size: 9.2,
      font,
      color: rgb(0.12, 0.15, 0.21),
      lineHeight: 11,
    })
    cursorY -= Math.max(lineHeight, lines.length * 11 + 3)
  }

  return boxHeight
}

function addPage(pdf: PDFDocument) {
  return pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
}

export async function generatePacojacoDocumentPdfBytes(document: PacojacoDocumentRow) {
  const printable = buildPacojacoPrintableDocument(document)
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique)

  const logoPath = path.join(process.cwd(), 'public/pacojaco/logo.png')
  const logoBytes = existsSync(logoPath) ? readFileSync(logoPath) : null
  const logo = logoBytes ? await pdf.embedPng(logoBytes) : null
  const footerTopY = 126
  const contentBottomLimit = 138

  const state = {
    page: addPage(pdf),
    y: PAGE_HEIGHT - MARGIN_Y,
  }
  let inItemsSection = false

  function newPage() {
    state.page = addPage(pdf)
    state.y = PAGE_HEIGHT - MARGIN_Y
    drawContinuationHeader()
    if (inItemsSection) {
      drawItemsHeader()
    }
  }

  function ensureSpace(height: number) {
    if (state.y - height < contentBottomLimit) {
      newPage()
    }
  }

  function drawTopHeader() {
    const page = state.page
    if (logo) {
      const dims = logo.scaleToFit(190, 92)
      page.drawImage(logo, {
        x: 30,
        y: PAGE_HEIGHT - MARGIN_Y - dims.height + 4,
        width: dims.width,
        height: dims.height,
      })
    } else {
      page.drawText('ANGEL CARE', {
        x: 30,
        y: PAGE_HEIGHT - 48,
        size: 24,
        font: bold,
        color: rgb(0.06, 0.11, 0.24),
      })
    }

    page.drawText(pacojacoDocumentPrintLabel(printable.document_type), {
      x: 382,
      y: PAGE_HEIGHT - 44,
      size: 24,
      font: bold,
      color: rgb(0.08, 0.12, 0.2),
    })
    page.drawText(printable.document_number, {
      x: 382,
      y: PAGE_HEIGHT - 64,
      size: 13,
      font: bold,
      color: rgb(0.08, 0.35, 0.75),
    })
    page.drawText(printable.status.replace(/_/g, ' ').toUpperCase(), {
      x: 382,
      y: PAGE_HEIGHT - 80,
      size: 9,
      font: bold,
      color: rgb(0.32, 0.37, 0.49),
    })

    page.drawLine({
      start: { x: 30, y: PAGE_HEIGHT - 134 },
      end: { x: PAGE_WIDTH - 30, y: PAGE_HEIGHT - 134 },
      color: rgb(0.82, 0.88, 0.96),
      thickness: 1,
    })

    state.y = PAGE_HEIGHT - 144
  }

  function drawContinuationHeader() {
    const page = state.page
    page.drawText(`${printable.document_number} • ${pacojacoDocumentPrintLabel(printable.document_type)}`, {
      x: 30,
      y: PAGE_HEIGHT - 32,
      size: 11,
      font: bold,
      color: rgb(0.08, 0.12, 0.2),
    })
    page.drawText(printable.status.replace(/_/g, ' ').toUpperCase(), {
      x: PAGE_WIDTH - 134,
      y: PAGE_HEIGHT - 32,
      size: 9,
      font: bold,
      color: rgb(0.32, 0.37, 0.49),
    })
    page.drawLine({
      start: { x: 30, y: PAGE_HEIGHT - 44 },
      end: { x: PAGE_WIDTH - 30, y: PAGE_HEIGHT - 44 },
      color: rgb(0.84, 0.88, 0.95),
      thickness: 1,
    })
    state.y = PAGE_HEIGHT - 62
  }

  function drawSectionHeading(title: string, subtitle?: string) {
    state.page.drawText(title, {
      x: 30,
      y: state.y,
      size: 12.5,
      font: bold,
      color: rgb(0.08, 0.12, 0.2),
    })
    if (subtitle) {
      state.page.drawText(subtitle, {
        x: 30,
        y: state.y - 12,
        size: 8.5,
        font: regular,
        color: rgb(0.39, 0.45, 0.56),
      })
    }
    state.y -= subtitle ? 26 : 20
  }

  function drawItemsHeader() {
    const tableX = 30
    const tableWidth = PAGE_WIDTH - 60
    const colWidths = [52, 213, 52, 76, 76, 80]
    const columns = ['REF', 'DESCRIPTION', 'CAT', 'QTY', 'UNIT', 'TOTAL']
    const headerHeight = 22
    const tableTop = state.y

    state.page.drawRectangle({
      x: tableX,
      y: tableTop,
      width: tableWidth,
      height: headerHeight,
      color: rgb(0.92, 0.95, 1),
      borderColor: rgb(0.81, 0.86, 0.96),
      borderWidth: 1,
    })

    let cursorX = tableX
    columns.forEach((label, index) => {
      state.page.drawText(label, {
        x: cursorX + 5,
        y: tableTop - 14,
        size: 8.3,
        font: bold,
        color: rgb(0.08, 0.12, 0.2),
      })
      cursorX += colWidths[index]
      if (index < columns.length - 1) {
        state.page.drawLine({
          start: { x: cursorX, y: tableTop },
          end: { x: cursorX, y: tableTop - headerHeight },
          color: rgb(0.81, 0.86, 0.96),
          thickness: 1,
        })
      }
    })

    state.y -= headerHeight
  }

  function drawParagraph(text: string, x: number, width: number, size = 9.4, lineHeight = 11.2, color = rgb(0.12, 0.15, 0.21)) {
    const lines = wrapText(regular, text, size, width)
    lines.forEach((line, index) => {
      state.page.drawText(line, {
        x,
        y: state.y - index * lineHeight,
        size,
        font: regular,
        color,
      })
    })
    state.y -= lines.length * lineHeight
  }

  drawTopHeader()

  const companyBoxHeight = drawKeyValueBox(
    state.page,
    regular,
    bold,
    'COMPANY / CONTACT',
    PACOJACO_COMPANY_BOX_ENTRIES,
    30,
    state.y,
    255
  )

  const clientBoxHeight = drawKeyValueBox(
    state.page,
    regular,
    bold,
    'DOCUMENT / CLIENT',
    [
      ['Date', printable.issue_date],
      ['Type', pacojacoDocumentPrintLabel(printable.document_type)],
      ['Object', printable.object],
      ['Client', printable.client_name],
      ['Company', printable.client_company],
      ['Email', printable.client_email],
      ['Phone', printable.client_phone],
      ['Region', printable.region],
    ],
    308,
    state.y,
    257
  )

  state.y -= Math.max(companyBoxHeight, clientBoxHeight) + 18

  drawSectionHeading('ITEMS')
  ensureSpace(160)
  inItemsSection = true

  const tableX = 30
  const tableWidth = PAGE_WIDTH - 60
  const colWidths = [52, 213, 52, 76, 76, 80]
  drawItemsHeader()

  if (!printable.items.length) {
    ensureSpace(28)
    state.page.drawRectangle({
      x: tableX,
      y: state.y,
      width: tableWidth,
      height: 28,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.87, 0.9, 0.94),
      borderWidth: 1,
    })
    state.page.drawText('No items connected yet.', {
      x: tableX + 10,
      y: state.y - 18,
      size: 9.2,
      font: italic,
      color: rgb(0.42, 0.47, 0.56),
    })
    state.y -= 28
  } else {
    printable.items.forEach((item, index) => {
      const descLines = wrapText(bold, item.designation, 9.2, colWidths[1] - 10)
      const descNoteLines = item.description ? wrapText(regular, item.description, 8.4, colWidths[1] - 10) : []
      const rowHeight = Math.max(24, 12 + descLines.length * 11 + descNoteLines.length * 9)
      ensureSpace(rowHeight + 4)

      state.page.drawRectangle({
        x: tableX,
        y: state.y,
        width: tableWidth,
        height: rowHeight,
        color: index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.99, 0.99, 0.995),
        borderColor: rgb(0.88, 0.91, 0.95),
        borderWidth: 1,
      })

      const rowY = state.y - 14
      const values = [
        item.ref || '—',
        null,
        item.category || 'SVC',
        String(item.quantity ?? 0),
        formatMoney(item.unit_price, printable.currency),
        formatMoney(item.total, printable.currency),
      ]

      let cellX = tableX
      for (let column = 0; column < values.length; column += 1) {
        const cellWidth = colWidths[column]
        const text = values[column]
        if (column === 1) {
          const titleLineCount = drawWrappedLines(state.page, bold, item.designation, 9.2, cellX + 5, rowY, cellWidth - 10, 10, rgb(0.08, 0.12, 0.2))
          if (item.description) {
            drawWrappedLines(state.page, regular, item.description, 8.2, cellX + 5, rowY - titleLineCount * 10 - 2, cellWidth - 10, 9, rgb(0.36, 0.42, 0.52))
          }
        } else {
          state.page.drawText(String(text ?? '—'), {
            x: cellX + 5,
            y: rowY,
            size: 8.8,
            font: column === 5 ? bold : regular,
            color: rgb(0.12, 0.15, 0.21),
          })
        }
        cellX += cellWidth
        if (column < values.length - 1) {
          state.page.drawLine({
            start: { x: cellX, y: state.y },
            end: { x: cellX, y: state.y - rowHeight },
            color: rgb(0.88, 0.91, 0.95),
            thickness: 1,
          })
        }
      }

      state.y -= rowHeight
    })
  }

  inItemsSection = false
  state.y -= 18
  drawSectionHeading('INTERVENTIONS')
  ensureSpace(140)
  const interventionRows = buildPacojacoInterventionDisplayRows(printable)

  interventionRows.forEach((row) => {
    const rowHeight = Math.max(26, measureTextHeight(regular, row.summary, 8.8, PAGE_WIDTH - 86, 10) + 12)
    ensureSpace(rowHeight)

    state.page.drawRectangle({
      x: 30,
      y: state.y,
      width: PAGE_WIDTH - 60,
      height: rowHeight,
      color: rgb(0.99, 0.99, 1),
      borderColor: rgb(0.88, 0.91, 0.95),
      borderWidth: 1,
    })

    drawWrappedLines(state.page, bold, row.summary, 8.9, 40, state.y - 15, PAGE_WIDTH - 86, 10, rgb(0.08, 0.12, 0.2))
    state.y -= rowHeight + 6
  })

  ensureSpace(124)
  drawSectionHeading('PAYMENT & TOTALS')

  const paymentHeight = drawKeyValueBox(
    state.page,
    regular,
    bold,
    'PAYMENT INFO',
    [
      ['Method', printable.payment_method],
      ['Information', printable.payment_info],
      ['Payment date', printable.payment_date],
      ['Conditions', printable.conditions],
      ['Notes', printable.notes],
    ],
    30,
    state.y,
    246
  )

  const displayedTotals = getPacojacoDisplayedTotals(printable)
  const totalsHeight = 96
  drawRoundedBox(state.page, 290, state.y, 275, totalsHeight, [0.07, 0.11, 0.16], rgb(0.07, 0.11, 0.16))
  state.page.drawText('TOTALS', {
    x: 302,
    y: state.y - 16,
    size: 10,
    font: bold,
    color: rgb(1, 1, 1),
  })
  let totalY = state.y - 32
  displayedTotals.slice(0, 4).forEach(([label, value], index) => {
    state.page.drawText(label, {
      x: 302,
      y: totalY - index * 13.5,
      size: 9,
      font: regular,
      color: rgb(0.82, 0.88, 0.96),
    })
    state.page.drawText(formatMoney(value, printable.currency), {
      x: 518,
      y: totalY - index * 13.5,
      size: 9,
      font: bold,
      color: rgb(1, 1, 1),
    })
  })
  state.page.drawText(formatMoney(printable.total_ttc, printable.currency), {
    x: 302,
    y: state.y - 83,
    size: 15,
    font: bold,
    color: rgb(0.69, 0.95, 0.84),
  })
  state.page.drawText('TOTAL TTC', {
    x: 302,
    y: state.y - 96,
    size: 8.5,
    font: bold,
    color: rgb(0.82, 0.88, 0.96),
  })

  state.y -= Math.max(paymentHeight, totalsHeight) + 18

  state.page.drawLine({
    start: { x: 30, y: footerTopY },
    end: { x: PAGE_WIDTH - 30, y: footerTopY },
    color: rgb(0.82, 0.88, 0.96),
    thickness: 1,
  })

  const footerLines = PACOJACO_FOOTER_SIGNATURE_LINES
  let footerY = footerTopY - 12
  footerLines.forEach((line, index) => {
    state.page.drawText(line, {
      x: 30,
      y: footerY - index * 9.2,
      size: index === 0 ? 9.4 : 8.6,
      font: index === 0 ? bold : regular,
      color: rgb(0.08, 0.12, 0.2),
    })
  })

  state.y = footerTopY - 12
  drawParagraph(cleanText(printable.legal_footer || '—'), 280, PAGE_WIDTH - 310, 7.4, 8.4, rgb(0.34, 0.4, 0.5))

  return pdf.save()
}

export function getPacojacoDocumentPdfFilename(documentNumber: string) {
  return `${cleanFilename(documentNumber)}.pdf`
}
