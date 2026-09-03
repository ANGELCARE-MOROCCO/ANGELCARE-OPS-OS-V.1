'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- canonical admin routes are intentional. */
/* eslint-disable @next/next/no-img-element -- arbitrary operator media previews cannot use static dimensions. */

import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Archive, Clipboard, Download, ExternalLink, FileImage, FolderInput, FolderPlus, ImagePlus, RotateCcw, Search, UploadCloud, X } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CatalogAdminItem, CommerceRecord, MediaAsset, MediaFolder } from '../types'
import type { MediaUsageReference } from '../../total-commerce-control/types'
import { MarketplaceFilePicker, formatMarketplaceFileSize } from '../../components/MarketplaceFilePicker'
import { GovernedCommandDialog } from '../../reality-completion/components/GovernedCommandDialog'
import { apiRequest, Field, SelectField, StudioForm, StudioNotice, useStudioMutation } from './StudioClient'
import { MEDIA_ACCEPT, MEDIA_ALLOWED_MIME, MEDIA_MAX_BYTES, csvEscape, detectProductReference, matchManifestFiles, parseMediaManifest, runBounded, sha256File, type DuplicatePolicy, type MediaRole, type QueueState } from '../media-library-operations'

type UploadSession = { assetId: string; uploadUrl: string; completionUrl: string }
type PreflightResult = { checksumSha256: string; errors: string[]; duplicate: MediaAsset | null; state: 'READY' | 'FAILED' }
type QueueItem = { id: string; file: File; checksum: string; reference: string; altTextFr: string; folderId: string; role: MediaRole; state: QueueState; progress: number; error: string; duplicate: MediaAsset | null; duplicatePolicy: DuplicatePolicy; asset: MediaAsset | null; productIds: string[] }
type MappingResult = { queueId: string; productId: string; label: string; state: 'SUCCESS' | 'FAILED'; error?: string }

function putFile(url: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    request.setRequestHeader('content-type', file.type)
    request.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)) }
    request.onerror = () => reject(new Error('Le stockage Windows Marketplace est injoignable.'))
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`Le stockage a refusé le fichier (HTTP ${request.status}).`))
    request.send(file)
  })
}

function newQueueItem(file: File): QueueItem {
  return { id: crypto.randomUUID(), file, checksum: '', reference: detectProductReference(file.name), altTextFr: file.name.replace(/\.[^.]+$/, '').replaceAll(/[-_]+/g, ' '), folderId: '', role: 'gallery', state: 'PENDING', progress: 0, error: '', duplicate: null, duplicatePolicy: 'USE_EXISTING', asset: null, productIds: [] }
}

function folderBreadcrumb(folderId: string, folders: MediaFolder[]): string {
  if (!folderId) return 'Racine Marketplace'
  const byId = new Map(folders.map(folder => [folder.id, folder]))
  const labels: string[] = []
  let cursor: string | null = folderId
  for (let depth = 0; cursor && depth < 20; depth += 1) { const folder = byId.get(cursor); if (!folder) break; labels.unshift(folder.name); cursor = folder.parent_id }
  return ['Racine Marketplace', ...labels].join(' / ')
}

export function MediaLibraryStudio({ initialMedia, initialFolders, catalogItems, mode = 'library', canManage = false }: { initialMedia: MediaAsset[]; initialFolders: MediaFolder[]; catalogItems: CatalogAdminItem[]; mode?: string; canManage?: boolean }) {
  const [media, setMedia] = useState(initialMedia)
  const [folders, setFolders] = useState(initialFolders)
  const [query, setQuery] = useState(''), [folderFilter, setFolderFilter] = useState(''), [mimeFilter, setMimeFilter] = useState(''), [assignmentFilter, setAssignmentFilter] = useState('all')
  const [selected, setSelected] = useState<MediaAsset | null>(null), [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [showFolder, setShowFolder] = useState(false), [activeFolderId, setActiveFolderId] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([]), [manifestFiles, setManifestFiles] = useState<File[]>([]), [manifestErrors, setManifestErrors] = useState<string[]>([])
  const [preflighting, setPreflighting] = useState(false), [uploading, setUploading] = useState(false), [mappingPreview, setMappingPreview] = useState(false), [mappingResults, setMappingResults] = useState<MappingResult[]>([])
  const [usages, setUsages] = useState<MediaUsageReference[]>([]), [usageBusy, setUsageBusy] = useState(false), [replacementFiles, setReplacementFiles] = useState<File[]>([])
  const cancelled = useRef(new Set<string>())
  const mutation = useStudioMutation()
  const folderById = useMemo(() => new Map(folders.map(folder => [folder.id, folder])), [folders])
  const filtered = useMemo(() => media.filter(asset => {
    const reference = String(asset.metadata?.product_reference || detectProductReference(asset.file_name))
    const assigned = asset.usage_count > 0
    const roles = asset.assignment_roles || []
    return `${asset.file_name} ${asset.asset_key} ${asset.alt_text_fr} ${reference}`.toLowerCase().includes(query.toLowerCase()) && (!folderFilter || asset.folder_id === folderFilter) && (!mimeFilter || asset.mime_type.startsWith(mimeFilter)) && (assignmentFilter === 'all' || (assignmentFilter === 'assigned' ? assigned : assignmentFilter === 'unassigned' ? !assigned : assignmentFilter === 'primary' ? roles.includes('primary') : assignmentFilter === 'gallery' ? roles.includes('gallery') : assignmentFilter === 'missing-alt' ? !asset.alt_text_fr.trim() : asset.status === 'failed'))
  }), [media, query, folderFilter, mimeFilter, assignmentFilter])

  function patchQueue(id: string, patch: Partial<QueueItem>) { setQueue(current => current.map(item => item.id === id ? { ...item, ...patch } : item)) }
  function chooseFiles(files: File[]) { cancelled.current.clear(); setMappingPreview(false); setMappingResults([]); setManifestFiles([]); setManifestErrors([]); setQueue(files.map(file => ({ ...newQueueItem(file), folderId: activeFolderId }))) }

  async function applyManifest(files: File[]) {
    setManifestFiles(files)
    if (!files[0]) { setManifestErrors([]); return }
    const parsed = parseMediaManifest(await files[0].text())
    const matched = matchManifestFiles(queue.map(item => item.file.name), parsed.rows)
    const errors = [...parsed.errors]
    if (matched.unmatchedFiles.length) errors.push(`Fichiers sans ligne manifeste: ${matched.unmatchedFiles.join(', ')}.`)
    if (matched.unmatchedRows.length) errors.push(`Lignes sans fichier local: ${matched.unmatchedRows.map(row => row.fileName).join(', ')}.`)
    setManifestErrors(errors)
    setQueue(current => current.map(item => {
      const row = matched.matches.find(match => match.fileName.toLowerCase() === item.file.name.toLowerCase())?.row
      if (!row) return item
      const folder = folders.find(candidate => candidate.slug.toLowerCase() === row.folderSlug.toLowerCase())
      return { ...item, reference: row.productReference || item.reference, role: row.role, altTextFr: row.altTextFr || item.altTextFr, folderId: folder?.id || item.folderId, error: row.folderSlug && !folder ? `Dossier manifeste introuvable: ${row.folderSlug}` : '' }
    }))
  }

  async function preflight() {
    if (!queue.length) return
    setPreflighting(true)
    try {
      const withHashes = queue.map(item => ({ ...item }))
      await runBounded(withHashes, 3, async item => { item.checksum = item.checksum || await sha256File(item.file) })
      const local = withHashes.map(item => {
        const errors: string[] = []
        if (!MEDIA_ALLOWED_MIME.has(item.file.type)) errors.push('Format non pris en charge.')
        if (item.file.size <= 0 || item.file.size > MEDIA_MAX_BYTES) errors.push('Taille vide ou supérieure à 40 Mo.')
        if (item.error) errors.push(item.error)
        return { ...item, error: errors.join(' '), state: errors.length ? 'FAILED' as const : 'READY' as const }
      })
      const eligible = local.filter(item => item.state === 'READY')
      const remote = eligible.length ? await apiRequest<PreflightResult[]>('/api/angelcare-marketplace/admin/media/preflight', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ files: eligible.map(item => ({ fileName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size, checksumSha256: item.checksum, folderId: item.folderId || null })) }) }) : []
      let index = 0
      setQueue(local.map(item => {
        if (item.state !== 'READY') return item
        const result = remote[index++]
        const productIds = item.reference ? catalogItems.filter(product => [product.public_reference, product.item_key, product.sku].some(value => String(value || '').toUpperCase().startsWith(item.reference.toUpperCase()))).map(product => product.id) : []
        return { ...item, duplicate: result?.duplicate || null, error: result?.errors.join(' ') || '', state: result?.state || 'FAILED', productIds }
      }))
    } catch (error) { await mutation.run(() => Promise.reject(error), '') } finally { setPreflighting(false) }
  }

  async function uploadOne(item: QueueItem) {
    if (cancelled.current.has(item.id) || item.state === 'CANCELLED') return null
    if (item.duplicate && item.duplicatePolicy === 'USE_EXISTING') { patchQueue(item.id, { state: 'SUCCESS', progress: 100, asset: item.duplicate }); return item.duplicate }
    patchQueue(item.id, { state: 'UPLOADING', progress: 0, error: '' })
    try {
      const replaceAssetId = item.duplicate && item.duplicatePolicy === 'REPLACE_EXISTING' ? item.duplicate.id : null
      const session = await apiRequest<UploadSession>('/api/angelcare-marketplace/admin/media/upload-session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size, folderId: item.folderId || null, altTextFr: item.altTextFr, replaceAssetId }) })
      await putFile(session.uploadUrl, item.file, progress => patchQueue(item.id, { progress }))
      const asset = await apiRequest<MediaAsset>(session.completionUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size, checksumSha256: item.checksum, folderId: item.folderId || null, altTextFr: item.altTextFr, productReference: item.reference }) })
      patchQueue(item.id, { state: 'SUCCESS', progress: 100, asset }); setMedia(current => [asset, ...current.filter(candidate => candidate.id !== asset.id)]); return asset
    } catch (error) { patchQueue(item.id, { state: 'FAILED', error: error instanceof Error ? error.message : 'Échec du téléversement.' }); return null }
  }

  async function executeQueue(items: QueueItem[]) { setUploading(true); await runBounded(items.filter(item => !cancelled.current.has(item.id)), 3, async item => { await uploadOne(item) }); setUploading(false) }
  function cancelItem(id: string) { cancelled.current.add(id); patchQueue(id, { state: 'CANCELLED', error: '' }) }

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await mutation.run(() => apiRequest<{ record: MediaFolder }>('/api/angelcare-marketplace/admin/commerce/media-folders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: String(form.get('name') || ''), parent_id: activeFolderId || null, status: 'active' }) }), 'Dossier média prêt.')
    if (result) { setFolders(current => [...current.filter(folder => folder.id !== result.record.id), result.record].sort((a, b) => a.name.localeCompare(b.name))); setActiveFolderId(result.record.id); setShowFolder(false) }
  }

  async function patchAssets(payload: (asset: MediaAsset) => Record<string, unknown>) {
    const assets = media.filter(asset => selectedAssetIds.includes(asset.id))
    const results = await Promise.allSettled(assets.map(asset => apiRequest<{ record: MediaAsset }>(`/api/angelcare-marketplace/admin/commerce/media/${asset.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload(asset)) })))
    const changed = results.flatMap(result => result.status === 'fulfilled' ? [result.value.record] : [])
    setMedia(current => current.map(asset => changed.find(next => next.id === asset.id) || asset))
  }
  async function batchMove() { await patchAssets(() => ({ folder_id: activeFolderId || null })); setSelectedAssetIds([]) }
  async function batchMetadata(altTextFr: string) { await patchAssets(asset => ({ alt_text_fr: altTextFr || asset.alt_text_fr, folder_id: activeFolderId || asset.folder_id })) }
  async function archiveSelected() { const assets = media.filter(asset => selectedAssetIds.includes(asset.id)); const results = await Promise.allSettled(assets.map(asset => apiRequest<{ record: MediaAsset }>(`/api/angelcare-marketplace/admin/commerce/media/${asset.id}`, { method: 'DELETE' }))); const archived = new Set(results.flatMap(result => result.status === 'fulfilled' ? [result.value.record.id] : [])); setMedia(current => current.filter(asset => !archived.has(asset.id))); setSelectedAssetIds([]) }

  async function assignProducts() {
    const proposed = queue.filter(item => item.state === 'SUCCESS' && item.asset && item.productIds.length)
    if (!mappingPreview) { setMappingPreview(true); return }
    const results: MappingResult[] = []
    for (const item of proposed) for (const productId of item.productIds) {
      const product = catalogItems.find(candidate => candidate.id === productId)
      try {
        await apiRequest<{ record: CommerceRecord }>('/api/angelcare-marketplace/admin/commerce/catalog-media', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ catalog_item_id: productId, media_key: item.role === 'primary' ? 'primary' : `gallery-${item.asset!.id}`, media_type: item.asset!.media_type, asset_url: item.asset!.desktop_url, alt_text_fr: item.altTextFr, status: 'active', sort_order: item.role === 'primary' ? 0 : 100 }) })
        results.push({ queueId: item.id, productId, label: product?.public_reference || productId, state: 'SUCCESS' })
      } catch (error) { results.push({ queueId: item.id, productId, label: product?.public_reference || productId, state: 'FAILED', error: error instanceof Error ? error.message : 'Affectation impossible.' }) }
    }
    setMappingResults(results); setMappingPreview(false)
  }

  function exportManifest() {
    const header = ['product_reference', 'asset_key', 'file_name', 'folder_slug', 'role', 'alt_text_fr']
    const lines = queue.filter(item => item.state === 'SUCCESS' && item.asset).map(item => [item.reference, item.asset!.asset_key, item.asset!.file_name, folderById.get(item.asset!.folder_id || '')?.slug || '', item.role, item.asset!.alt_text_fr].map(csvEscape).join(','))
    const href = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'angelcare-marketplace-media-manifest.csv'; anchor.click(); URL.revokeObjectURL(href)
  }

  async function transformAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage || !selected) return
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries([...form.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']))
    const result = await mutation.run(() => apiRequest<MediaAsset>(`/api/angelcare-marketplace/admin/media/${selected.id}/transform`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }), 'Transformation et dérivées responsive appliquées.')
    if (result) { setSelected(result); setMedia(current => current.map(asset => asset.id === result.id ? result : asset)) }
  }

  async function replaceAsset() { const file = replacementFiles[0]; if (!file || !selected) return; const asset = await uploadOne({ ...newQueueItem(file), altTextFr: selected.alt_text_fr, folderId: selected.folder_id || '', duplicate: selected, duplicatePolicy: 'REPLACE_EXISTING', state: 'READY' }); if (asset) setSelected(asset); setReplacementFiles([]) }
  async function deleteAsset(reason: string) { if (!selected) return; const result = await apiRequest<{ deleted: boolean }>(`/api/angelcare-marketplace/admin/media/${selected.id}/permanent-delete`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmation: 'SUPPRIMER DÉFINITIVEMENT', reason }) }); if (result.deleted) { setMedia(current => current.filter(asset => asset.id !== selected.id)); setSelected(null); setUsages([]) } }
  async function selectAsset(asset: MediaAsset) { setSelected(asset); setReplacementFiles([]); setUsageBusy(true); try { const response = await fetch(`/api/angelcare-marketplace/admin/media/${asset.id}/usage`); const payload = await response.json() as { data?: MediaUsageReference[] }; setUsages(response.ok && payload.data ? payload.data : []) } finally { setUsageBusy(false) } }

  return <main className={styles.shell} data-readonly={!canManage}>
    <section className={styles.workspaceHero} data-accent="media"><div><span>MEDIA LIBRARY · {mode.toUpperCase()}</span><h1>Ingestion média opérationnelle.</h1><p>Préflight, file d’attente bornée, dossiers canoniques, métadonnées et affectations — aucune publication automatique.</p></div><div className={styles.workspaceStats}><strong>{media.length}</strong><span>assets persistants</span></div></section>
    {!canManage ? <p className={styles.permissionBanner}>Bibliothèque en lecture seule · permission marketplace.media.manage requise.</p> : null}<StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <section className={styles.mediaOperationsGrid}><aside className={styles.uploadPanel}><h2><UploadCloud size={20}/> Lot à téléverser</h2><MarketplaceFilePicker accept={MEDIA_ACCEPT} files={queue.map(item => item.file)} onFilesChange={chooseFiles} label="Choisir plusieurs médias" description="Sélection multiple ou glisser-déposer · préflight obligatoire · 40 Mo par fichier" maxSizeBytes={MEDIA_MAX_BYTES} multiple deferValidation disabled={!canManage || uploading}/><label className={styles.field}><span>Dossier actif</span><select value={activeFolderId} onChange={event => setActiveFolderId(event.target.value)}><option value="">Racine Marketplace</option>{folders.map(folder => <option value={folder.id} key={folder.id}>{folderBreadcrumb(folder.id, folders)}</option>)}</select></label><p className={styles.folderBreadcrumb}>{folderBreadcrumb(activeFolderId, folders)}</p><button type="button" className={styles.secondaryAction} onClick={() => setShowFolder(value => !value)}><FolderPlus size={16}/> Créer un dossier ici</button>{showFolder ? <form className={styles.inlineFolderForm} onSubmit={createFolder}><Field name="name" label="Nom du dossier" required/><button className={styles.primaryAction} type="submit">Créer</button></form> : null}<h3>Manifeste facultatif</h3><MarketplaceFilePicker accept=".csv,text/csv" files={manifestFiles} onFilesChange={files => void applyManifest(files)} label="Associer un manifeste CSV" description="file_name, product_reference, role, alt_text_fr, folder_slug" disabled={!queue.length || uploading}/>{manifestErrors.map(error => <p className={styles.queueError} key={error}>{error}</p>)}<div className={styles.batchActions}><button type="button" onClick={() => void preflight()} disabled={!queue.length || preflighting || uploading}>Préflight complet</button><button type="button" onClick={() => void executeQueue(queue.filter(item => item.state === 'READY'))} disabled={uploading || !queue.some(item => item.state === 'READY') || manifestErrors.length > 0}>Téléverser les READY</button><button type="button" onClick={() => void executeQueue(queue.filter(item => item.state === 'FAILED'))} disabled={uploading || !queue.some(item => item.state === 'FAILED')}>Réessayer les échecs</button></div><a className={styles.storageHealthLink} href="/angelcare-marketplace/admin/configuration/storage/media">État du stockage média Marketplace</a></aside>
      <section className={styles.batchPanel}>
        <header><div><span>BATCH PREFLIGHT</span><h2>{queue.length} fichier(s)</h2></div><strong>CONCURRENCY=3</strong></header>
        <div className={styles.batchTableWrap}><table className={styles.batchTable}><thead><tr><th>Fichier</th><th>Référence suggérée</th><th>Alt FR</th><th>Dossier</th><th>Rôle</th><th>Doublon</th><th>État</th><th>Action</th></tr></thead><tbody>{queue.map(item => <tr key={item.id} data-state={item.state}>
          <td><strong>{item.file.name}</strong><small>{item.file.type || 'MIME absent'} · {formatMarketplaceFileSize(item.file.size)}</small>{item.asset ? <small>{item.asset.asset_key} · {item.asset.status} · {item.productIds.length ? `${item.productIds.length} affectation(s)` : 'non assigné'}</small> : null}{item.error ? <em>{item.error}</em> : null}</td>
          <td><input value={item.reference} onChange={event => patchQueue(item.id, { reference: event.target.value })} placeholder="HS-AC-001"/></td>
          <td><input value={item.altTextFr} onChange={event => patchQueue(item.id, { altTextFr: event.target.value })}/></td>
          <td><select value={item.folderId} onChange={event => patchQueue(item.id, { folderId: event.target.value })}><option value="">Racine</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></td>
          <td><select value={item.role} onChange={event => patchQueue(item.id, { role: event.target.value as MediaRole })}><option value="primary">Principal</option><option value="gallery">Galerie</option></select></td>
          <td>{item.duplicate ? <select value={item.duplicatePolicy} onChange={event => patchQueue(item.id, { duplicatePolicy: event.target.value as DuplicatePolicy })}><option value="USE_EXISTING">Utiliser l’existant</option><option value="REPLACE_EXISTING">Remplacer l’existant</option><option value="UPLOAD_ANYWAY">Téléverser quand même</option></select> : 'Aucun'}</td>
          <td><b>{item.state}</b>{item.state === 'UPLOADING' ? <progress max={100} value={item.progress}/> : null}</td>
          <td><button type="button" title="Annuler" disabled={item.state === 'SUCCESS' || item.state === 'UPLOADING'} onClick={() => cancelItem(item.id)}><X size={14}/></button>{item.state === 'FAILED' ? <button type="button" title="Réessayer" onClick={() => void executeQueue([item])}><RotateCcw size={14}/></button> : null}</td>
        </tr>)}</tbody></table></div>
        {queue.some(item => item.state === 'SUCCESS') ? <footer className={styles.postUploadActions}><button type="button" onClick={exportManifest}><Download size={15}/> Exporter le manifeste CSV</button><button type="button" onClick={() => setMappingPreview(true)}>Prévisualiser les affectations produit</button></footer> : null}
        {mappingPreview ? <section className={styles.mappingPreview}><header><h3>Affectations proposées — aucune publication</h3><button type="button" onClick={() => setMappingPreview(false)}><X size={14}/></button></header>{queue.filter(item => item.state === 'SUCCESS' && item.asset).map(item => <article key={item.id}><img src={item.asset!.desktop_url} alt={item.altTextFr}/><div><strong>{item.asset!.asset_key}</strong><span>{item.reference || 'Sans référence'} · {item.role}</span></div><select multiple value={item.productIds} onChange={event => patchQueue(item.id, { productIds: Array.from(event.currentTarget.selectedOptions, option => option.value) })}>{catalogItems.map(product => <option key={product.id} value={product.id}>{product.public_reference} · {product.name_fr}</option>)}</select></article>)}<button type="button" className={styles.primaryAction} onClick={() => void assignProducts()}>Confirmer les affectations</button></section> : null}{mappingResults.length ? <div className={styles.mappingResults}>{mappingResults.map(result => <p key={`${result.queueId}:${result.productId}`} data-state={result.state}><strong>{result.label}</strong> {result.state}{result.error ? ` · ${result.error}` : ''}</p>)}</div> : null}</section></section>
    <section className={styles.libraryOperations}>
      <div className={styles.libraryToolbar}>
        <label><Search size={17}/><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Nom, asset_key, alt text, référence…"/></label>
        <select value={folderFilter} onChange={event => setFolderFilter(event.target.value)}><option value="">Tous les dossiers</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
        <select value={mimeFilter} onChange={event => setMimeFilter(event.target.value)}><option value="">Tous types</option><option value="image/">Images</option><option value="video/">Vidéos</option><option value="application/">Documents</option></select>
        <select value={assignmentFilter} onChange={event => setAssignmentFilter(event.target.value)}><option value="all">Tous états</option><option value="assigned">Assignés</option><option value="unassigned">Non assignés</option><option value="primary">Principal</option><option value="gallery">Galerie</option><option value="missing-alt">Alt manquant</option><option value="failed">Échec upload</option></select>
        <span>{filtered.length} résultats</span>
      </div>
      {selectedAssetIds.length ? <form className={styles.bulkMediaBar} onSubmit={event => { event.preventDefault(); void batchMetadata(String(new FormData(event.currentTarget).get('bulk_alt') || '')) }}><strong>{selectedAssetIds.length} sélectionné(s)</strong><input name="bulk_alt" placeholder="Alt FR commun (facultatif)"/><select value={activeFolderId} onChange={event => setActiveFolderId(event.target.value)}><option value="">Racine Marketplace</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><button type="button" onClick={() => void batchMove()}><FolderInput size={14}/> Déplacer</button><button type="submit">Modifier les métadonnées</button><button type="button" onClick={() => void archiveSelected()}><Archive size={14}/> Archiver</button></form> : null}
      <div className={styles.mediaGrid}>{filtered.map(asset => <article className={styles.mediaCard} data-selected={selected?.id === asset.id} key={asset.id}><label className={styles.assetSelect}><input type="checkbox" checked={selectedAssetIds.includes(asset.id)} onChange={event => setSelectedAssetIds(current => event.target.checked ? [...current, asset.id] : current.filter(id => id !== asset.id))}/></label><button type="button" onClick={() => void selectAsset(asset)}>{asset.media_type === 'image' ? <img src={asset.desktop_url} alt={asset.alt_text_fr}/> : <div className={styles.fileFallback}><FileImage size={30}/><span>{asset.media_type}</span></div>}<div><strong>{asset.file_name}</strong><span>{folderById.get(asset.folder_id || '')?.name || 'Racine'} · {asset.assignment_roles?.join(' + ') || (asset.usage_count ? 'assigné' : 'non assigné')}</span></div></button></article>)}</div>
    </section>
    <aside className={styles.assetInspector} data-open={Boolean(selected)}>{selected ? <>
      <button type="button" className={styles.inspectorClose} aria-label="Fermer l’inspecteur" onClick={() => setSelected(null)}><X/></button>
      <div className={styles.inspectorPreview}>{selected.media_type === 'image' ? <img src={selected.desktop_url} alt={selected.alt_text_fr}/> : <FileImage size={48}/>}</div><span>ASSET INSPECTOR</span><h2>{selected.file_name}</h2>
      <dl className={styles.assetFacts}><div><dt>asset_key</dt><dd>{selected.asset_key}</dd></div><div><dt>Dossier</dt><dd>{folderBreadcrumb(selected.folder_id || '', folders)}</dd></div><div><dt>Type / taille</dt><dd>{selected.mime_type} · {formatMarketplaceFileSize(selected.size_bytes)}</dd></div><div><dt>État</dt><dd>{selected.status} · {selected.assignment_roles?.join(' + ') || (selected.usage_count ? 'assigné' : 'non assigné')}</dd></div></dl>
      <div className={styles.assetUtilityActions}><button type="button" onClick={() => void navigator.clipboard.writeText(selected.asset_key)}><Clipboard size={13}/> Copier asset_key</button><a href={selected.public_url} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Prévisualiser</a></div>
      <StudioForm resource="media" id={selected.id} onSaved={record => { const next = record as MediaAsset; setSelected(next); setMedia(current => current.map(asset => asset.id === next.id ? next : asset)) }} submitLabel="Enregistrer">
        <Field name="alt_text_fr" label="Alt FR" defaultValue={selected.alt_text_fr} required/><div className={styles.formGrid}><Field name="alt_text_en" label="Alt EN" defaultValue={selected.alt_text_en}/><Field name="alt_text_ar" label="Alt AR" defaultValue={selected.alt_text_ar}/></div>
        <label className={styles.field}><span>Dossier</span><select name="folder_id" defaultValue={selected.folder_id || ''}><option value="">Racine</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label><SelectField name="rights_status" label="Droits" defaultValue={selected.rights_status} options={['owned', 'licensed', 'public_domain', 'restricted', 'expired']}/>
        <div className={styles.formGrid}><Field name="focal_x" label="Focal X (%)" type="number" min={0} defaultValue={Number(selected.focal_point.x || 50)}/><Field name="focal_y" label="Focal Y (%)" type="number" min={0} defaultValue={Number(selected.focal_point.y || 50)}/></div><input type="hidden" name="status" value="active"/>
      </StudioForm>
      <form className={styles.transformPanel} onSubmit={transformAsset}><strong>Recadrer & transformer</strong><div className={styles.formGrid}><Field name="crop_x" label="X px" type="number" min={0}/><Field name="crop_y" label="Y px" type="number" min={0}/></div><div className={styles.formGrid}><Field name="crop_width" label="Largeur px" type="number" min={1}/><Field name="crop_height" label="Hauteur px" type="number" min={1}/></div><SelectField name="rotation" label="Rotation" defaultValue="0" options={[{ value: '0', label: '0°' }, { value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }]}/><button type="submit" className={styles.secondaryAction}>Appliquer la transformation</button></form>
      <section className={styles.transformPanel}><strong>Remplacer le fichier, conserver les références</strong><MarketplaceFilePicker accept={MEDIA_ACCEPT} files={replacementFiles} onFilesChange={setReplacementFiles} label="Sélectionner le remplacement" description="Exécution après confirmation." maxSizeBytes={MEDIA_MAX_BYTES} disabled={!canManage}/><button type="button" className={styles.secondaryAction} disabled={!replacementFiles.length || mutation.saving} onClick={() => void replaceAsset()}>Confirmer le remplacement</button></section>
      <section className={styles.usagePanel}><strong>Utilisé actuellement</strong><p>{usageBusy ? 'Recherche des références…' : `${usages.length} référence(s)`}</p>{usages.slice(0, 30).map(usage => <div key={`${usage.source}:${usage.object_id}:${usage.slot_key}`}><b>{usage.label}</b><small>{usage.object_type} · {usage.slot_key}</small></div>)}</section>
      <GovernedCommandDialog title={`Supprimer définitivement · ${selected.file_name}`} triggerLabel="Supprimer le fichier et ses métadonnées" danger disabled={!canManage || usageBusy || usages.length > 0} fields={[]} reasonLabel="Motif" onSubmit={async (_values, reason) => deleteAsset(reason)}/>
    </> : <div className={styles.emptyInspector}><ImagePlus size={30}/><p>Sélectionnez un média.</p></div>}</aside>
  </main>
}
