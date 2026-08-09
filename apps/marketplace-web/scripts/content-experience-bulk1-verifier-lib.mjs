import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

export function repoRoot() {
  return path.resolve(process.env.BULK1_REPO_ROOT || process.cwd())
}

export function opsRoot() {
  const root = repoRoot()
  const candidate = path.join(root, "apps", "ops-web")
  return fs.existsSync(candidate) ? candidate : root
}

export function read(relative) {
  const file = path.join(opsRoot(), relative)
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${relative}`)
  return fs.readFileSync(file, "utf8")
}

export function exists(relative) {
  return fs.existsSync(path.join(opsRoot(), relative))
}

export function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function hasAll(text, tokens, label) {
  for (const token of tokens) assert(text.includes(token), `${label}: missing ${token}`)
}

export function listStyleRefs(text) {
  return [...text.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1])
}

export function listCssClasses(text) {
  return new Set([...text.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
}

export function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
}

export function pass(label) {
  console.log(`PASS — ${label}`)
}

export function run(label, fn) {
  try { fn(); pass(label) } catch (error) { console.error(`FAIL — ${label}`); console.error(error instanceof Error ? error.message : error); process.exit(1) }
}
