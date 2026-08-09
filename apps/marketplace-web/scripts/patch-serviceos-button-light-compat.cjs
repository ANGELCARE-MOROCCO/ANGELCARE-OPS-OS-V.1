const fs = require('fs')
const path = require('path')

const target = path.join(process.cwd(), 'components/service-os/ServiceOSPrimitives.tsx')
if (!fs.existsSync(target)) {
  console.error('Missing components/service-os/ServiceOSPrimitives.tsx')
  process.exit(1)
}

let src = fs.readFileSync(target, 'utf8')

// Add compatibility props to ServiceOSButton type if missing.
src = src.replace(
  /type\s+ServiceOSButtonProps\s*=\s*CommonProps\s*&\s*\{([^}]+)\}/s,
  (match, body) => {
    let next = body
    const additions = [
      "light?: boolean",
      "variant?: 'solid' | 'light' | 'ghost' | 'outline' | string",
      "disabled?: boolean",
      "target?: string",
      "rel?: string",
    ]
    for (const add of additions) {
      const key = add.split('?:')[0].trim()
      if (!new RegExp(`\\b${key}\\?`).test(next)) next += `\n  ${add}`
    }
    return `type ServiceOSButtonProps = CommonProps & {${next}\n}`
  }
)

// If props are inline and no named type exists, broaden the function destructuring annotation.
src = src.replace(
  /export\s+function\s+ServiceOSButton\s*\(\s*\{([^)]*)\}\s*:\s*CommonProps\s*&\s*\{([^}]+)\}\s*\)/s,
  (match, destructured, body) => {
    let next = body
    const additions = [
      "light?: boolean",
      "variant?: 'solid' | 'light' | 'ghost' | 'outline' | string",
      "disabled?: boolean",
      "target?: string",
      "rel?: string",
    ]
    for (const add of additions) {
      const key = add.split('?:')[0].trim()
      if (!new RegExp(`\\b${key}\\?`).test(next)) next += `\n  ${add}`
    }
    if (!/\blight\b/.test(destructured)) destructured = destructured.replace(/\.\.\.rest/, 'light, variant, disabled, target, rel, ...rest')
    return `export function ServiceOSButton({${destructured}}: CommonProps & {${next}\n})`
  }
)

// Ensure implementation tolerates light even if not used.
src = src.replace(
  /export\s+function\s+ServiceOSButton\s*\(\s*\{([^}]*)\}\s*:\s*ServiceOSButtonProps\s*\)/s,
  (match, destructured) => {
    let next = destructured
    for (const prop of ['light', 'variant', 'disabled', 'target', 'rel']) {
      if (!new RegExp(`\\b${prop}\\b`).test(next)) next = next.replace(/\.\.\.rest/, `${prop}, ...rest`)
    }
    return `export function ServiceOSButton({${next}}: ServiceOSButtonProps)`
  }
)

fs.writeFileSync(target, src)
console.log('✅ Patched ServiceOSButton compatibility props: light, variant, disabled, target, rel')
