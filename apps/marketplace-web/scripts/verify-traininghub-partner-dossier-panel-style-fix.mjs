import fs from 'node:fs'

const file = 'components/traininghub/internal/PartnerDossierMegaModal.tsx'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

const content = fs.readFileSync(file, 'utf8')

const checks = [
  {
    name: 'Panel prop no longer shadows eyebrow style',
    pass: !content.includes('function Panel({ title, eyebrow, children }'),
  },
  {
    name: 'Panel uses eyebrowText as label',
    pass: content.includes('function Panel({ title, eyebrow: eyebrowText, children }') && content.includes('<span style={eyebrow}>{eyebrowText}</span>'),
  },
  {
    name: 'eyebrow style constant still exists',
    pass: content.includes('const eyebrow: CSSProperties'),
  },
]

console.table(checks)

if (checks.some((check) => !check.pass)) {
  console.error('TrainingHub partner dossier panel style fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner dossier panel style fix verification PASSED.')
