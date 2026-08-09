const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'components/service-os/ServiceOSPrimitives.tsx')

if (!fs.existsSync(file)) {
  console.error('Missing file:', file)
  process.exit(1)
}

let src = fs.readFileSync(file, 'utf8')

// Add description prop to the ServiceOSHeader prop type if the primitive uses inline prop typing.
src = src.replace(
  /title\?: ReactNode;\s*subtitle\?: ReactNode;\s*eyebrow\?: ReactNode;\s*actions\?: ReactNode;\s*tone\?: string \| undefined;/,
  'title?: ReactNode; subtitle?: ReactNode; description?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; tone?: string | undefined;'
)

src = src.replace(
  /title\?: ReactNode;\s*subtitle\?: ReactNode;\s*eyebrow\?: ReactNode;\s*actions\?: ReactNode;\s*tone\?: string;/,
  'title?: ReactNode; subtitle?: ReactNode; description?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; tone?: string;'
)

// Add description to destructuring if ServiceOSHeader destructures props.
src = src.replace(
  /export function ServiceOSHeader\(\{\s*title,\s*subtitle,\s*eyebrow,\s*actions,\s*tone\s*\}/,
  'export function ServiceOSHeader({ title, subtitle, description, eyebrow, actions, tone }'
)

// Support components that render subtitle directly by preferring subtitle then description.
src = src.replace(/\{subtitle\}/g, '{subtitle ?? description}')

// If description was not injected by the regex because props are typed through CommonProps differently,
// apply a broader safe fallback for the header signature.
if (!src.includes('description?: ReactNode') && src.includes('ServiceOSHeader')) {
  src = src.replace(
    /(ServiceOSHeader\([^)]*:\s*CommonProps\s*&\s*\{[^}]*subtitle\?: ReactNode;)/,
    '$1 description?: ReactNode;'
  )
}

fs.writeFileSync(file, src)
console.log('✅ Patched ServiceOSHeader to accept both subtitle and description props.')
