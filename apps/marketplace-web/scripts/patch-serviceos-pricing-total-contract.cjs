const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app/(protected)/services/pricing-engine/page.tsx')
if (!fs.existsSync(file)) {
  console.error('Missing pricing engine page:', file)
  process.exit(1)
}

let src = fs.readFileSync(file, 'utf8')

const helpers = `
function getServicePriceTotal(price: unknown): number {
  const p = price as {
    total?: number
    totalMad?: number
    finalPrice?: number
    finalAmount?: number
    calculatedTotal?: number
    amount?: number
    price?: number
    baseRate?: number
    base?: number
  }

  return Number(
    p.total ??
      p.totalMad ??
      p.finalPrice ??
      p.finalAmount ??
      p.calculatedTotal ??
      p.amount ??
      p.price ??
      p.baseRate ??
      p.base ??
      0,
  )
}

function getServicePriceModifiers(price: unknown): Array<{ label: string; amount: number }> {
  const p = price as {
    modifiers?: Array<{ label?: string; amount?: number; value?: number }>
    adjustments?: Array<{ label?: string; amount?: number; value?: number }>
    priceModifiers?: Array<{ label?: string; amount?: number; value?: number }>
  }

  const list = p.modifiers ?? p.adjustments ?? p.priceModifiers ?? []
  return list.map((item, index) => ({
    label: item.label ?? \`Modifier \${index + 1}\`,
    amount: Number(item.amount ?? item.value ?? 0),
  }))
}
`

if (!src.includes('function getServicePriceTotal(price: unknown): number')) {
  const marker = /type PriceModifier[\s\S]*?}\n/
  if (marker.test(src)) {
    src = src.replace(marker, match => `${match}${helpers}`)
  } else {
    const exportMarker = 'export default function Page()'
    src = src.replace(exportMarker, `${helpers}\n${exportMarker}`)
  }
}

src = src.replace(/samplePrice\.total/g, 'getServicePriceTotal(samplePrice)')
src = src.replace(/samplePrice\.modifiers\.map\(/g, 'getServicePriceModifiers(samplePrice).map(')
src = src.replace(/samplePrice\.modifiers\?\.map\(/g, 'getServicePriceModifiers(samplePrice).map(')
src = src.replace(/samplePrice\.modifiers\s*\|\|\s*\[\]/g, 'getServicePriceModifiers(samplePrice)')
src = src.replace(/samplePrice\.modifiers/g, 'getServicePriceModifiers(samplePrice)')

fs.writeFileSync(file, src)
console.log('✅ Patched pricing-engine/page.tsx to use the CalculatedServicePrice contract safely.')
