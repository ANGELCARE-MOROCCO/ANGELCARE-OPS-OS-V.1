import ExcelJS from 'exceljs'

function scalar(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return value as string | number | boolean | Date
}

export async function buildAngelcare360Xlsx(rows: Array<Record<string, unknown>>, sheetName = 'SANILA') {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SANILA Operating System'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || 'SANILA', { views: [{ state: 'frozen', ySplit: 1 }] })
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  sheet.columns = keys.map((key) => ({ header: key, key, width: Math.min(42, Math.max(12, key.length + 3)) }))
  for (const row of rows) sheet.addRow(Object.fromEntries(keys.map((key) => [key, scalar(row[key])])))
  const header = sheet.getRow(1)
  header.font = { bold: true }
  header.alignment = { vertical: 'middle', horizontal: 'left' }
  header.height = 22
  sheet.autoFilter = keys.length ? { from: 'A1', to: `${sheet.getColumn(keys.length).letter}1` } : undefined
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: 'top', wrapText: true }
  })
  const bytes = await workbook.xlsx.writeBuffer()
  return new Uint8Array(bytes as ArrayBuffer)
}
