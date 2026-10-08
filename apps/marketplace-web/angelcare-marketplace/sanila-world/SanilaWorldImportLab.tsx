'use client'

import { useState } from 'react'
import { Archive, CheckCircle2, FileArchive, ShieldCheck, UploadCloud, XCircle } from 'lucide-react'
import { SANILA_REQUIRED_SOURCE_PATHS, SANILA_WORLD_ROUTES } from './contract'
import styles from '@/angelcare-marketplace/sanila-admin/sanila-admin.module.css'

type Entry = { file: File; path: string }

const MAX_FILES = 5000
const MAX_BYTES = 280 * 1024 * 1024

const cleanPath = (value: string) => value.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter((part) => part && part !== '.' && part !== '..').join('/')
const u16 = (view: DataView, offset: number) => view.getUint16(offset, true)
const u32 = (view: DataView, offset: number) => view.getUint32(offset, true)

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw new Error('Ce navigateur ne supporte pas la décompression ZIP native.')
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('deflate-raw' as any))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function unzip(file: File): Promise<Entry[]> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let eocd = -1
  for (let i = Math.max(0, bytes.byteLength - 22); i >= Math.max(0, bytes.byteLength - 65557); i--) if (u32(view, i) === 0x06054b50) { eocd = i; break }
  if (eocd < 0) throw new Error('Archive ZIP invalide.')
  const count = u16(view, eocd + 10)
  if (count > MAX_FILES) throw new Error(`ZIP refusé: ${count} fichiers > ${MAX_FILES}.`)
  let cursor = u32(view, eocd + 16), total = 0
  const decoder = new TextDecoder('utf-8')
  const out: Entry[] = []
  for (let index = 0; index < count; index++) {
    if (u32(view, cursor) !== 0x02014b50) throw new Error('Répertoire central ZIP invalide.')
    const flags = u16(view, cursor + 8), method = u16(view, cursor + 10), compressedSize = u32(view, cursor + 20), uncompressedSize = u32(view, cursor + 24)
    const nameLength = u16(view, cursor + 28), extraLength = u16(view, cursor + 30), commentLength = u16(view, cursor + 32), localOffset = u32(view, cursor + 42)
    if (flags & 1) throw new Error('ZIP chiffré non accepté.')
    const rawName = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength))
    const path = cleanPath(rawName)
    cursor += 46 + nameLength + extraLength + commentLength
    if (!path || rawName.endsWith('/')) continue
    total += uncompressedSize
    if (total > MAX_BYTES) throw new Error('ZIP SANILA supérieur à 280 MB décompressés.')
    if (u32(view, localOffset) !== 0x04034b50) throw new Error(`Entrée ZIP invalide: ${path}`)
    const localNameLength = u16(view, localOffset + 26), localExtraLength = u16(view, localOffset + 28)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const compressed = bytes.slice(start, start + compressedSize)
    const content = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : (() => { throw new Error(`Compression non supportée (${method}).`) })()
    const fileBuffer = new ArrayBuffer(content.byteLength)
    new Uint8Array(fileBuffer).set(content)
    out.push({ file: new File([fileBuffer], path.split('/').pop() || path), path })
  }
  return out
}

async function fingerprint(paths: string[]) {
  const raw = new TextEncoder().encode(paths.slice().sort().join('\n'))
  const digest = await crypto.subtle.digest('SHA-256', raw)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function SanilaWorldImportLab({ onRegistered }: { onRegistered?: () => void }) {
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<{ packageName: string; files: number; routes: number; desktop: number; mobile: number; source: number; fingerprint: string; blockers: string[] } | null>(null)
  const [message, setMessage] = useState('')

  async function inspect(file?: File) {
    if (!file) return
    setBusy(true); setMessage(''); setReport(null)
    try {
      const rows = await unzip(file)
      const paths = rows.map((row) => row.path).filter((path) => !path.startsWith('__MACOSX/'))
      const lowered = paths.map((path) => path.toLowerCase())
      const routeRefs = SANILA_WORLD_ROUTES.filter((route) => lowered.some((path) => path.endsWith(route.desktopReference.toLowerCase()) || path.includes(`/pages/${route.slug.split('/').pop()?.toLowerCase() || ''}`)))
      const desktop = SANILA_WORLD_ROUTES.filter((route) => lowered.some((path) => path.endsWith(route.desktopReference.toLowerCase()))).length
      const mobile = SANILA_WORLD_ROUTES.filter((route) => lowered.some((path) => path.endsWith(route.mobileReference.toLowerCase()))).length
      const source = SANILA_REQUIRED_SOURCE_PATHS.filter((required) => lowered.some((path) => path.endsWith(required.toLowerCase()))).length
      const blockers: string[] = []
      if (source < SANILA_REQUIRED_SOURCE_PATHS.length) blockers.push(`Source SANILA incomplète: ${source}/${SANILA_REQUIRED_SOURCE_PATHS.length} contrats clés.`)
      if (routeRefs.length < SANILA_WORLD_ROUTES.length) blockers.push(`Routes SANILA partiellement reconnues: ${routeRefs.length}/${SANILA_WORLD_ROUTES.length}.`)
      if (!lowered.some((path) => path.includes('sanila-public'))) blockers.push('Namespace sanila-public introuvable.')
      const fp = await fingerprint(paths)
      setReport({ packageName: file.name, files: paths.length, routes: routeRefs.length, desktop, mobile, source, fingerprint: fp, blockers })
      setMessage(blockers.length ? 'Analyse terminée avec points à examiner.' : 'SANILA World reconnu et prêt à enregistrer.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import SANILA impossible.') }
    finally { setBusy(false) }
  }

  async function register() {
    if (!report || report.blockers.length) return
    setBusy(true); setMessage('Enregistrement SANILA World…')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/sanila/world', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'register_import', packageName: report.packageName, fingerprint: report.fingerprint }) })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || 'Enregistrement impossible.')
      setMessage('PASS · SANILA World enregistré comme draft isolé.')
      onRegistered?.()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Enregistrement impossible.') }
    finally { setBusy(false) }
  }

  return <section className={styles.importLab}>
    <div className={styles.sectionHead}><div><span>SANILA WORLD IMPORT ENGINE</span><h2>Importer uniquement le monde public SANILA.</h2></div><ShieldCheck size={22}/></div>
    <label className={styles.dropzone}><UploadCloud size={30}/><strong>Déposer / choisir le ZIP SANILA</strong><small>Inspection locale · aucun code étranger exécuté · limite 280 MB.</small><input type="file" accept=".zip,application/zip" onChange={(event)=>void inspect(event.target.files?.[0])}/><span>{busy?'Analyse…':'Choisir un ZIP'}</span></label>
    {message ? <div className={styles.notice}>{message}</div> : null}
    {report ? <div className={styles.importReport}>
      <div><FileArchive size={18}/><strong>{report.packageName}</strong><small>{report.files} fichiers · SHA256 {report.fingerprint.slice(0,16)}…</small></div>
      <div className={styles.kpiStrip}><article><b>{report.routes}/{SANILA_WORLD_ROUTES.length}</b><span>routes</span></article><article><b>{report.desktop}/{SANILA_WORLD_ROUTES.length}</b><span>desktop</span></article><article><b>{report.mobile}/{SANILA_WORLD_ROUTES.length}</b><span>mobile</span></article><article><b>{report.source}/{SANILA_REQUIRED_SOURCE_PATHS.length}</b><span>contrats source</span></article></div>
      {report.blockers.length ? <ul className={styles.blockers}>{report.blockers.map((item)=><li key={item}><XCircle size={14}/>{item}</li>)}</ul> : <div className={styles.pass}><CheckCircle2 size={16}/> SANILA-only package contract = PASS</div>}
      <button type="button" className={styles.primaryButton} disabled={busy||Boolean(report.blockers.length)} onClick={()=>void register()}><Archive size={15}/> Enregistrer le draft SANILA</button>
    </div> : null}
  </section>
}
