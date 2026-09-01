import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const contentPath = path.join(root, 'angelcare-marketplace/sanila-public/content.ts')
const universePath = path.join(root, 'angelcare-marketplace/sanila-public/SanilaPublicUniverse.tsx')
const metadataPath = path.join(root, 'angelcare-marketplace/sanila-public/metadata.ts')
const demoPath = path.join(root, 'angelcare-marketplace/sanila-public/SanilaDemoForm.tsx')
const files = [contentPath, universePath, metadataPath, demoPath]

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing SANILA public authority: ${file}`)
}

const content = fs.readFileSync(contentPath, 'utf8')
const universe = fs.readFileSync(universePath, 'utf8')
const metadata = fs.readFileSync(metadataPath, 'utf8')
const demo = fs.readFileSync(demoPath, 'utf8')
const combined = [content, universe, metadata, demo].join('\n')

const slugMatches = [...content.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
if (slugMatches.length !== 27) throw new Error(`Expected 27 public pages, found ${slugMatches.length}`)
if (new Set(slugMatches).size !== 27) throw new Error('Duplicate SANILA public slug detected')

const approvedAccess = [
  '/angelcare-360-access/login',
  '/angelcare-360-portal/login',
  '/angelcare-360-teacher/login',
  '/angelcare-360-staff/login',
  '/angelcare-360-parent/login',
  '/angelcare-360-student/login',
]

for (const href of approvedAccess) {
  if (!content.includes(href)) throw new Error(`Missing approved customer access authority: ${href}`)
}

const forbiddenRoutes = ['/angelcare-360-operator']
for (const route of forbiddenRoutes) {
  if (combined.includes(route)) throw new Error(`Forbidden public internal route exposure: ${route}`)
}

const forbiddenCopy = ['Unexpected token', '<!DOCTYPE', 'Server Components', 'PostgREST', 'schema cache', 'tenant unresolved']
for (const word of forbiddenCopy) {
  if (combined.includes(word)) throw new Error(`Forbidden public technical language: ${word}`)
}

if (!demo.includes('/api/angelcare-marketplace/public/inquiries')) throw new Error('Demo form is not wired to the existing public inquiry authority')
if (!universe.includes('/sanila/sanila-operating-system-logo.png')) throw new Error('Official SANILA logo asset is not used')
if (!metadata.includes('fr_MA')) throw new Error('French Morocco OpenGraph locale missing')

console.log('SANILA_PUBLIC_PAGES=27')
console.log('PUBLIC_SLUG_UNIQUENESS=PASS')
console.log('CUSTOMER_ACCESS_AUTHORITIES=PASS')
console.log('PUBLIC_INTERNAL_ROUTE_EXPOSURE=0')
console.log('ENGINEERING_LANGUAGE_GATE=PASS')
console.log('PUBLIC_INQUIRY_AUTHORITY=PASS')
console.log('OFFICIAL_LOGO_AUTHORITY=PASS')
console.log('SANILA_PUBLIC_RELEASE_STATIC_GATE=PASS')
