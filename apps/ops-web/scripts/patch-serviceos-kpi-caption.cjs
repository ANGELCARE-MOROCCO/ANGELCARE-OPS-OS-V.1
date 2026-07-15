const fs = require('fs')
const path = require('path')

const root = process.cwd()
const primitivesPath = path.join(root, 'components/service-os/ServiceOSPrimitives.tsx')
const pricingPath = path.join(root, 'app/(protected)/services/pricing-engine/page.tsx')

function patchFile(filePath, patcher) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${filePath}`)
    process.exitCode = 1
    return
  }
  const before = fs.readFileSync(filePath, 'utf8')
  const after = patcher(before)
  if (before !== after) {
    fs.writeFileSync(filePath, after)
    console.log(`Patched: ${path.relative(root, filePath)}`)
  } else {
    console.log(`No change needed: ${path.relative(root, filePath)}`)
  }
}

patchFile(primitivesPath, (src) => {
  let out = src

  // Add caption prop to any inline ServiceOSKpi prop signature that already has helper.
  out = out.replace(
    /helper\?: ReactNode;\s*trend\?: ReactNode;/g,
    'helper?: ReactNode; caption?: ReactNode; trend?: ReactNode;'
  )

  // Add caption to destructuring if the component destructures helper.
  out = out.replace(
    /\{\s*label,\s*value,\s*helper,\s*trend,\s*tone,\s*className,\s*style\s*\}/g,
    '{ label, value, helper, caption, trend, tone, className, style }'
  )

  // Render caption as fallback to helper when the variable exists in JSX.
  out = out.replace(/\{helper && \(/g, '{(helper || caption) && (')
  out = out.replace(/\{helper\}/g, '{helper || caption}')

  return out
})

patchFile(pricingPath, (src) => {
  // Keep the page compatible with the stricter primitive contract too.
  return src.replace(/\bcaption=/g, 'helper=')
})

console.log('ServiceOS KPI caption/helper compatibility patch complete.')
