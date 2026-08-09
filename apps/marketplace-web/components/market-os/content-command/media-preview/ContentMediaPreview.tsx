"use client"

import * as React from "react"
import {
  AlertTriangle,
  AudioLines,
  ExternalLink,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  GalleryHorizontalEnd,
  Globe2,
  Maximize2,
  Minimize2,
  Presentation,
  RefreshCcw,
  RotateCw,
  X,
} from "lucide-react"
import styles from "./content-media-preview.module.css"

export type ContentMediaKind = "image" | "pdf" | "video" | "audio" | "document" | "presentation" | "spreadsheet" | "archive" | "web" | "unknown"
export type ContentMediaMode = "compact" | "card" | "studio" | "inspector" | "fullscreen"
export type ContentMediaFit = "cover" | "contain"

export type ContentMediaSource = {
  id?: string | null
  title: string
  url?: string | null
  storagePath?: string | null
  bridgeFileId?: string | null
  storageKey?: string | null
  contentType?: string | null
  filename?: string | null
  kind?: ContentMediaKind | null
  pageCount?: number | null
  sizeBytes?: number | null
  posterUrl?: string | null
  sourceLabel?: string | null
}

type LinkMetadata = {
  title?: string
  description?: string
  image?: string
  favicon?: string
  finalUrl?: string
  contentType?: string
}

const EXT_KIND: Record<string, ContentMediaKind> = {
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", avif: "image", svg: "image", bmp: "image", tif: "image", tiff: "image",
  pdf: "pdf",
  mp4: "video", mov: "video", webm: "video", m4v: "video", avi: "video", mkv: "video",
  mp3: "audio", wav: "audio", m4a: "audio", aac: "audio", ogg: "audio", flac: "audio",
  doc: "document", docx: "document", txt: "document", rtf: "document", odt: "document", md: "document",
  ppt: "presentation", pptx: "presentation", odp: "presentation", key: "presentation",
  xls: "spreadsheet", xlsx: "spreadsheet", csv: "spreadsheet", ods: "spreadsheet",
  zip: "archive", rar: "archive", "7z": "archive", tar: "archive", gz: "archive",
}

function clean(value: unknown) { return String(value ?? "").trim() }
function extension(value: string) {
  const path = value.split(/[?#]/)[0]
  const part = path.split("/").pop() || ""
  return part.includes(".") ? part.split(".").pop()!.toLowerCase() : ""
}
export function detectContentMediaKind(source: ContentMediaSource): ContentMediaKind {
  if (source.kind) return source.kind
  const contentType = clean(source.contentType).toLowerCase()
  if (contentType.startsWith("image/")) return "image"
  if (contentType === "application/pdf") return "pdf"
  if (contentType.startsWith("video/")) return "video"
  if (contentType.startsWith("audio/")) return "audio"
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "presentation"
  if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType === "text/csv") return "spreadsheet"
  if (contentType.includes("word") || contentType.includes("document") || contentType.startsWith("text/")) return "document"
  if (contentType.includes("zip") || contentType.includes("archive") || contentType.includes("compressed")) return "archive"
  if (contentType.includes("html")) return "web"
  const ext = extension(clean(source.filename || source.url || source.storagePath))
  if (EXT_KIND[ext]) return EXT_KIND[ext]
  const hint = [source.title, source.filename, source.sourceLabel].map(clean).join(" ").toLowerCase()
  if (/\bpdf\b|brochure|plaquette|manuel|rapport|catalogue/.test(hint)) return "pdf"
  if (/image|photo|visuel|poster|affiche|bannière|banner|logo|création graphique/.test(hint)) return "image"
  if (/vidéo|video|reel|motion|film/.test(hint)) return "video"
  if (/audio|podcast|voice|voix/.test(hint)) return "audio"
  if (/présentation|presentation|deck|slides|powerpoint/.test(hint)) return "presentation"
  if (/tableur|spreadsheet|excel|csv/.test(hint)) return "spreadsheet"
  if (/document|brief|script|texte|word/.test(hint)) return "document"
  if (/^https?:\/\//i.test(clean(source.url || source.storagePath))) return "web"
  return "unknown"
}
function sourceUrl(source: ContentMediaSource) {
  const opaqueStorageKey = !source.storageKey && !source.bridgeFileId && source.storagePath && !/^https?:\/\//i.test(clean(source.storagePath)) ? clean(source.storagePath) : ""
  if (source.bridgeFileId || source.storageKey || opaqueStorageKey) {
    const params = new URLSearchParams()
    if (source.bridgeFileId) params.set("fileId", source.bridgeFileId)
    if (source.storageKey || opaqueStorageKey) params.set("storageKey", source.storageKey || opaqueStorageKey)
    return `/api/market-os/content-command-headquarters/file-preview?${params.toString()}`
  }
  const raw = clean(source.url || source.storagePath)
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) return `/api/market-os/content-command-headquarters/media-preview?mode=proxy&url=${encodeURIComponent(raw)}`
  return raw
}
function rawExternalUrl(source: ContentMediaSource) {
  const raw = clean(source.url || source.storagePath)
  return /^https?:\/\//i.test(raw) ? raw : ""
}
function formatBytes(value?: number | null) {
  const bytes = Number(value || 0)
  if (!bytes) return ""
  const units = ["o", "Ko", "Mo", "Go"]
  let amount = bytes
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1 }
  return `${amount >= 10 || unit === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unit]}`
}
function iconFor(kind: ContentMediaKind) {
  if (kind === "image") return FileImage
  if (kind === "pdf" || kind === "document") return FileText
  if (kind === "video") return Film
  if (kind === "audio") return AudioLines
  if (kind === "presentation") return Presentation
  if (kind === "spreadsheet") return FileSpreadsheet
  if (kind === "archive") return FileArchive
  if (kind === "web") return Globe2
  return File
}

export function ContentMediaPreview({
  source,
  mode = "card",
  fit: controlledFit,
  interactive = mode === "inspector" || mode === "studio",
  className = "",
  showLabel = true,
}: {
  source: ContentMediaSource
  mode?: ContentMediaMode
  fit?: ContentMediaFit
  interactive?: boolean
  className?: string
  showLabel?: boolean
}) {
  const kind = detectContentMediaKind(source)
  const resolved = sourceUrl(source)
  const external = rawExternalUrl(source)
  const [fit, setFit] = React.useState<ContentMediaFit>(controlledFit || (kind === "image" ? "cover" : "contain"))
  const [failed, setFailed] = React.useState(false)
  const [retryKey, setRetryKey] = React.useState(0)
  const [expanded, setExpanded] = React.useState(false)
  const [rotation, setRotation] = React.useState(0)
  const [ratio, setRatio] = React.useState("unknown")
  const [metadata, setMetadata] = React.useState<LinkMetadata | null>(null)
  const Icon = iconFor(kind)

  React.useEffect(() => {
    setFailed(false)
    setMetadata(null)
    setRotation(0)
  }, [resolved, source.id])

  React.useEffect(() => {
    if (kind !== "web" || !external) return
    const controller = new AbortController()
    fetch(`/api/market-os/content-command-headquarters/media-preview?mode=metadata&url=${encodeURIComponent(external)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("LINK_PREVIEW_UNAVAILABLE")))
      .then((payload) => setMetadata(payload?.metadata || null))
      .catch(() => setMetadata(null))
    return () => controller.abort()
  }, [external, kind, retryKey])

  const mediaLabel = [kind.toUpperCase(), source.pageCount ? `${source.pageCount} p.` : "", formatBytes(source.sizeBytes)].filter(Boolean).join(" · ")
  const metaImage = metadata?.image ? `/api/market-os/content-command-headquarters/media-preview?mode=proxy&url=${encodeURIComponent(metadata.image)}` : ""

  function classifyImage(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget
    const value = img.naturalWidth / Math.max(1, img.naturalHeight)
    setRatio(value > 2.1 ? "ultrawide" : value > 1.2 ? "landscape" : value < .72 ? "story" : value < .9 ? "portrait" : "square")
    setFailed(false)
  }
  function retry() { setFailed(false); setRetryKey((value) => value + 1) }

  const visual = !resolved && kind !== "web" ? null : failed ? null : kind === "image" ? (
    <img key={`${resolved}:${retryKey}`} src={resolved} alt={`Aperçu ${source.title}`} loading="lazy" onLoad={classifyImage} onError={() => setFailed(true)} style={{ transform: `rotate(${rotation}deg)` }}/>
  ) : kind === "pdf" ? (
    <iframe key={`${resolved}:${retryKey}`} src={`${resolved}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`} title={`PDF ${source.title}`} loading="lazy" onError={() => setFailed(true)}/>
  ) : kind === "video" ? (
    <video key={`${resolved}:${retryKey}`} src={resolved} poster={source.posterUrl || undefined} controls={interactive || expanded} muted={!expanded} preload="metadata" onError={() => setFailed(true)}/>
  ) : kind === "audio" ? (
    <div className={styles.audioSurface}><AudioLines/><strong>{source.title}</strong><audio key={`${resolved}:${retryKey}`} src={resolved} controls preload="metadata" onError={() => setFailed(true)}/></div>
  ) : kind === "web" && metaImage ? (
    <img key={`${metaImage}:${retryKey}`} src={metaImage} alt={`Aperçu du lien ${source.title}`} loading="lazy" onLoad={classifyImage} onError={() => setFailed(true)}/>
  ) : null

  const fallback = <div className={styles.fallback}>
    {failed ? <AlertTriangle/> : <Icon/>}
    <strong>{failed ? "Aperçu indisponible" : kind === "web" ? metadata?.title || source.title : source.filename || source.title}</strong>
    <p>{failed ? "L’original reste conservé. Réessayez, ouvrez la source ou remplacez la référence." : metadata?.description || mediaLabel || "Aucune miniature web n’est disponible pour ce format."}</p>
    {failed && interactive ? <button type="button" onClick={retry}><RefreshCcw/> Réessayer</button> : null}
  </div>

  const frame = <div className={`${styles.root} ${styles[`mode_${mode}`]} ${className}`} data-kind={kind} data-ratio={ratio} data-fit={fit}>
    <div className={styles.viewport}>{visual || fallback}</div>
    {showLabel ? <div className={styles.badge}><Icon/>{mediaLabel || kind.toUpperCase()}</div> : null}
    {interactive ? <div className={styles.toolbar}>
      {(kind === "image" || kind === "pdf") ? <button type="button" title={fit === "cover" ? "Afficher le contenu complet" : "Remplir le cadre"} onClick={() => setFit((value) => value === "cover" ? "contain" : "cover")}>{fit === "cover" ? <Minimize2/> : <GalleryHorizontalEnd/>}</button> : null}
      {kind === "image" ? <button type="button" title="Pivoter" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw/></button> : null}
      {resolved ? <button type="button" title="Plein écran" onClick={() => setExpanded(true)}><Maximize2/></button> : null}
      {(external || resolved) ? <a href={external || resolved} target="_blank" rel="noreferrer" title="Ouvrir la source"><ExternalLink/></a> : null}
    </div> : null}
  </div>

  return <>{frame}{expanded ? <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Aperçu plein écran ${source.title}`}>
    <header><div><small>{source.sourceLabel || "CONTENT COMMAND MEDIA"}</small><strong>{source.title}</strong><span>{mediaLabel}</span></div><button type="button" onClick={() => setExpanded(false)} aria-label="Fermer"><X/></button></header>
    <div className={styles.modalBody}>{React.cloneElement(frame, { className: `${styles.fullscreenFrame} ${className}` })}</div>
  </div> : null}</>
}

export function contentMediaSourceFromAsset(asset: {
  id?: string | null; title: string; preview_url?: string | null; storage_path?: string | null; metadata?: Record<string, unknown> | null; category?: string | null; output?: string | null
}): ContentMediaSource {
  const meta = asset.metadata || {}
  const string = (key: string) => typeof meta[key] === "string" ? String(meta[key]) : ""
  return {
    id: asset.id,
    title: asset.title,
    url: asset.preview_url || string("sourceUrl") || null,
    storagePath: asset.storage_path || null,
    bridgeFileId: string("bridgeFileId") || string("bridge_file_id") || null,
    storageKey: string("storageKey") || string("storage_key") || null,
    contentType: string("contentType") || string("content_type") || null,
    filename: string("filename") || string("originalFilename") || asset.output || asset.category || null,
    kind: (string("mediaKind") || null) as ContentMediaKind | null,
    pageCount: Number(meta.pageCount || meta.page_count || 0) || null,
    sizeBytes: Number(meta.sizeBytes || meta.size_bytes || 0) || null,
    posterUrl: string("posterUrl") || null,
    sourceLabel: string("sourceLabel") || asset.category || null,
  }
}
