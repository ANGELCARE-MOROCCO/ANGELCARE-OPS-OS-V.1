import fs from 'fs'
import path from 'path'

const file = path.join(process.cwd(), 'app/(protected)/hr/training/page.tsx')
if (!fs.existsSync(file)) {
  console.error(`Missing file: ${file}`)
  process.exit(1)
}

let src = fs.readFileSync(file, 'utf8')
const original = src

// Fix the exact React key warning shown in Next overlay: heatmapRows.map(row) + heatmapCols.map(col)
src = src.replace(
  /\{heatmapRows\.map\(\(row,\s*r\)\s*=>\s*<>/g,
  '{heatmapRows.map((row, r) => <div key={`heatmap-row-${r}-${row?.label || row?.department || row?.name || "row"}`} className="contents">'
)

src = src.replace(
  /\{heatmapRows\.map\(\(row,\s*r\)\s*=>\s*\(\s*<>/g,
  '{heatmapRows.map((row, r) => (\n  <div key={`heatmap-row-${r}-${row?.label || row?.department || row?.name || "row"}`} className="contents">'
)

src = src.replace(/<\/>\s*\)\}/g, '</div>\n))}')
src = src.replace(/<\/>\s*\}/g, '</div>\n)}')

// Add fallback keys to heatmap column cells when the map has no explicit key.
src = src.replace(
  /\{heatmapCols\.map\(\(col,\s*c\)\s*=>\s*<a\s+href=\{`#modal-heatmap-\$\{r\}-\$\{c\}`\}\s+className=/g,
  '{heatmapCols.map((col, c) => <a key={`heatmap-cell-${r}-${c}-${String(col)}`} href={`#modal-heatmap-${r}-${c}`} className='
)

src = src.replace(
  /\{heatmapCols\.map\(\(col,\s*c\)\s*=>\s*<div\s+className=/g,
  '{heatmapCols.map((col, c) => <div key={`heatmap-cell-${r}-${c}-${String(col)}`} className='
)

// Defensive: if duplicate accidental nested contents were produced, avoid syntax-breaking remnants.
src = src.replace(/<div key=\{`heatmap-row-([^`]+)`\} className="contents">\s*<div key=\{`heatmap-row-([^`]+)`\} className="contents">/g, '<div key={`heatmap-row-$1`} className="contents">')

if (src === original) {
  console.log('No matching heatmap fragment changed. The file may already be fixed or uses a different structure.')
} else {
  fs.writeFileSync(file, src)
  console.log('Fixed React key props in app/(protected)/hr/training/page.tsx')
}
