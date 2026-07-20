import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true })
fs.rmSync(path.join(root, '.build'), { recursive: true, force: true })
execFileSync(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', [], { cwd: root, stdio: 'inherit' })
fs.mkdirSync(path.join(root, 'dist'), { recursive: true })
fs.cpSync(path.join(root, '.build'), path.join(root, 'dist'), { recursive: true })
fs.cpSync(path.join(root, 'public'), path.join(root, 'dist'), { recursive: true })
fs.mkdirSync(path.join(root, 'dist/generated'), { recursive: true })
fs.cpSync(path.join(root, 'src/generated'), path.join(root, 'dist/generated'), { recursive: true })
const origin = (process.env.ANGELCARE_SAAS_ORIGIN || 'http://localhost:3000').replace(/\/$/, '')
const publicKey = String(process.env.ANGELCARE_EXTENSION_PUBLIC_KEY || '').trim()
const template = JSON.parse(fs.readFileSync(path.join(root, 'manifest.template.json'), 'utf8').replaceAll('__SAAS_ORIGIN__', origin))
if (publicKey) template.key = publicKey
fs.writeFileSync(path.join(root, 'dist/manifest.json'), JSON.stringify(template, null, 2) + '\n')
fs.writeFileSync(path.join(root, 'dist/runtime-config.json'), JSON.stringify({ apiBase: origin, buildVersion: template.version }, null, 2) + '\n')
console.log(`Built ANGELCARE Revenue Command for ${origin}`)
