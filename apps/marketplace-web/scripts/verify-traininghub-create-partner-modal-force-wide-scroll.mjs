import fs from 'node:fs'

const file = 'components/traininghub/internal/CreatePartnerDossierMegaModal.tsx'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

const content = fs.readFileSync(file, 'utf8')

const checks = [
  {
    name: 'Force full viewport width',
    pass: content.includes("width: 'calc(100vw - 16px)'") && content.includes("maxWidth: 'none'"),
  },
  {
    name: 'Force dynamic viewport height',
    pass: content.includes("height: 'calc(100dvh - 16px)'") && content.includes("maxHeight: 'calc(100dvh - 16px)'"),
  },
  {
    name: 'Left rail independently scrolls',
    pass: content.includes("const leftRail: CSSProperties") && content.includes("overflowY: 'auto'") && content.includes("scrollbarGutter: 'stable'"),
  },
  {
    name: 'Main card independently scrolls',
    pass: content.includes("const mainCard: CSSProperties") && content.includes("overflowY: 'auto'") && content.includes("height: '100%'"),
  },
  {
    name: 'Four-column form grid',
    pass: content.includes("const formGrid: CSSProperties") && content.includes("repeat(4,minmax(0,1fr))"),
  },
  {
    name: 'Five-column option grid',
    pass: content.includes("const optionGrid: CSSProperties") && content.includes("repeat(5,minmax(190px,1fr))"),
  },
  {
    name: 'Visible marker injected',
    pass: content.includes('WIDE SCROLL V2 ACTIVE') && content.includes('wideScrollMarker'),
  },
]

console.table(checks)

if (checks.some((check) => !check.pass)) {
  console.error('TrainingHub create partner FORCE wide scroll verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub create partner FORCE wide scroll verification PASSED.')
