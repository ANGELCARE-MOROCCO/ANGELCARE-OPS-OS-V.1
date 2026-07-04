import { readFileSync, existsSync } from 'node:fs'

const componentPath = 'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx'
const cssPath = 'app/globals.css'

function fail(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}

if (!existsSync(componentPath)) fail(`Missing ${componentPath}`)
if (!existsSync(cssPath)) fail(`Missing ${cssPath}`)

const component = readFileSync(componentPath, 'utf8')
const css = readFileSync(cssPath, 'utf8')

const requiredComponent = [
  'data-ac360-direction-cockpit="true"',
  'Ac360DirectionCockpitPage',
  'openDirectionCommand',
]

for (const token of requiredComponent) {
  if (!component.includes(token)) fail(`Component missing premium button/root token: ${token}`)
}

const requiredCss = [
  'ANGELCARE 360 — DIRECTION COCKPIT PREMIUM BUTTON SYSTEM',
  '[data-ac360-direction-cockpit="true"] button',
  'button[class*="bg-blue-700"]',
  'button[class*="bg-white"]',
  'button[class*="text-blue-700"]',
  'button.text-left',
]

for (const token of requiredCss) {
  if (!css.includes(token)) fail(`CSS missing premium button rule: ${token}`)
}

const forbiddenVisibleTechnical = [
  'Zero static action policy',
  'Phase 3O-R4',
  'Migration SQL Phase 3O-R3',
  'SQL actif',
  'pré-vol AC360',
]

for (const token of forbiddenVisibleTechnical) {
  if (component.includes(token)) fail(`Customer-facing component still exposes technical language: ${token}`)
}

console.log('✅ AC360 Direction premium corporate button system verification passed.')
console.log('✅ Scoped root, primary/secondary/micro-pill/report-card/mobile button styling and customer-facing cleanup confirmed.')
