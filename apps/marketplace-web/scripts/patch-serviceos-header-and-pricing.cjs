const fs = require('fs')
const path = require('path')

const root = process.cwd()
const primitivesPath = path.join(root, 'components/service-os/ServiceOSPrimitives.tsx')
const pricingPath = path.join(root, 'app/(protected)/services/pricing-engine/page.tsx')

function mustExist(file) {
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${file}`)
    process.exit(1)
  }
}

mustExist(primitivesPath)
mustExist(pricingPath)

let primitives = fs.readFileSync(primitivesPath, 'utf8')

// Add description?: React.ReactNode / ReactNode to any ServiceOSHeader prop type that already has subtitle.
primitives = primitives.replace(
  /(title\?\s*:\s*React(?:\.)?ReactNode\s*;\s*subtitle\?\s*:\s*React(?:\.)?ReactNode\s*;)/g,
  '$1\n  description?: React.ReactNode;'
)
primitives = primitives.replace(
  /(title\?\s*:\s*ReactNode\s*;\s*subtitle\?\s*:\s*ReactNode\s*;)/g,
  '$1\n  description?: ReactNode;'
)

// If the props are inline in the function signature, add description there too.
primitives = primitives.replace(
  /(subtitle\?\s*:\s*React(?:\.)?ReactNode\s*;\s*eyebrow\?)/g,
  'subtitle?: React.ReactNode; description?: React.ReactNode; eyebrow?'
)
primitives = primitives.replace(
  /(subtitle\?\s*:\s*ReactNode\s*;\s*eyebrow\?)/g,
  'subtitle?: ReactNode; description?: ReactNode; eyebrow?'
)

// Make sure ServiceOSHeader destructures description if it destructures subtitle.
primitives = primitives.replace(
  /export function ServiceOSHeader\s*\(\s*\{([^}]*)\}\s*:/,
  (match, props) => {
    if (props.includes('description')) return match
    if (props.includes('subtitle')) {
      return match.replace(props, props.replace('subtitle', 'subtitle, description'))
    }
    return match
  }
)

// Render subtitle OR description if implementation only uses subtitle.
primitives = primitives.replace(/\{subtitle\s*&&/g, '{(subtitle || description) &&')
primitives = primitives.replace(/\{subtitle\}/g, '{subtitle || description}')

fs.writeFileSync(primitivesPath, primitives)

let pricing = fs.readFileSync(pricingPath, 'utf8')
pricing = pricing.replace(/description=/g, 'subtitle=')
fs.writeFileSync(pricingPath, pricing)

console.log('✅ Patched ServiceOSHeader compatibility and pricing-engine header prop.')
