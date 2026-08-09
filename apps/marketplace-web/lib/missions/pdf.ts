function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function generateSimplePdf(title: string, lines: string[]): Uint8Array {
  const contentLines = [`BT /F1 18 Tf 50 790 Td (${esc(title)}) Tj`, '/F1 10 Tf 0 -28 Td']
  lines.slice(0, 60).forEach((line) => contentLines.push(`(${esc(line)}) Tj 0 -14 Td`))
  contentLines.push('ET')
  const stream = contentLines.join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((obj) => { offsets.push(pdf.length); pdf += `${obj}\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}
