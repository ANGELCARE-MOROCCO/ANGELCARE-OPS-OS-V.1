"use client"

import { useEffect, useRef, useState } from "react"
import {
  FileAudio, FileImage, FileText, FileVideo, LoaderCircle,
  Paperclip, RotateCcw, Send, Trash2, UploadCloud,
} from "lucide-react"
import type { AcWhatsAppMessage } from "@/lib/ac-whatsapp/types"
import { cx } from "./ACWhatsAppUI"
import { acApi } from "./useAcWhatsApp"

const MAX_FILE_BYTES = 50 * 1024 * 1024
const ACCEPTED_FILES = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
  "text/plain",
  "text/csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
].join(",")

const BLOCKED_EXTENSIONS = new Set([
  "app", "apk", "bat", "cmd", "com", "dmg", "exe", "jar", "js", "msi",
  "pkg", "ps1", "scr", "sh", "vbs",
])

type MediaMessageType = "image" | "video" | "audio" | "document"
type UploadPhase = "idle" | "selected" | "uploading" | "sending"

type AttachmentMessageStudioProps = {
  conversationId: string
  disabled?: boolean
  onSent: () => Promise<void> | void
  onSuccess: (title: string, description: string) => void
  onError: (title: string, description: string) => void
}

type UploadTicket = {
  uploadUrl: string
  storageKey: string
  storageProvider: "windows"
  headers: Record<string, string>
  fileName: string
  mimeType: string
  sizeBytes: number
  messageType: MediaMessageType
}

type UploadReceipt = {
  storageKey: string
  sha256: string
  sizeBytes: number
  mimeType: string
  fileName: string
}

type AttachmentResolution = {
  url: string
  fileName?: string | null
  mimeType?: string | null
  expiresIn?: number
}

function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf(".")
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ""
}

function humanBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 o"
  if (value < 1024) return `${value} o`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} Ko`
  return `${(value / 1024 ** 2).toFixed(1)} Mo`
}

function messageTypeFor(file: File): MediaMessageType {
  const mime = file.type.toLowerCase()
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  return "document"
}

function FileKindIcon({ type, className = "h-5 w-5" }: { type: MediaMessageType; className?: string }) {
  const Icon = type === "image"
    ? FileImage
    : type === "video"
      ? FileVideo
      : type === "audio"
        ? FileAudio
        : FileText
  return <Icon className={className} />
}

export function AttachmentMessageStudio({
  conversationId,
  disabled,
  onSent,
  onSuccess,
  onError,
}: AttachmentMessageStudioProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [phase, setPhase] = useState<UploadPhase>("idle")
  const [previewUrl, setPreviewUrl] = useState("")

  useEffect(() => {
    if (!file || !["image", "video", "audio"].includes(messageTypeFor(file))) {
      setPreviewUrl("")
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function reset() {
    setFile(null)
    setCaption("")
    setPhase("idle")
    if (inputRef.current) inputRef.current.value = ""
  }

  function chooseFile(next: File | undefined) {
    if (!next) return
    const extension = extensionOf(next.name)
    if (BLOCKED_EXTENSIONS.has(extension)) {
      onError(
        "Type de fichier non autorisé",
        "Les exécutables, scripts et installateurs ne peuvent pas être transmis depuis AC WhatsApp.",
      )
      return
    }
    if (!next.size || next.size > MAX_FILE_BYTES) {
      onError(
        "Fichier trop volumineux",
        "La taille maximale autorisée est de 50 Mo par pièce jointe.",
      )
      return
    }
    setFile(next)
    setCaption("")
    setPhase("selected")
  }

  async function sendAttachment() {
    if (!file || phase !== "selected") return
    const messageType = messageTypeFor(file)
    try {
      setPhase("uploading")
      const ticket = await acApi<UploadTicket>("/api/ac-whatsapp/attachments/upload", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      })

      const uploadResponse = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: ticket.headers,
        body: file,
      })
      const uploadPayload = await uploadResponse.json().catch(() => null)
      if (!uploadResponse.ok || !uploadPayload?.ok || !uploadPayload?.data) {
        throw new Error(uploadPayload?.error || `MEDIA_VAULT_UPLOAD_${uploadResponse.status}`)
      }
      const receipt = uploadPayload.data as UploadReceipt

      setPhase("sending")
      const cleanCaption = caption.trim()
      await acApi("/api/ac-whatsapp/messages/send", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          messageType: ticket.messageType,
          caption: cleanCaption,
          media: {
            storageProvider: "windows",
            storageKey: receipt.storageKey,
            storagePath: receipt.storageKey,
            sha256: receipt.sha256,
            mimetype: receipt.mimeType || ticket.mimeType,
            filename: receipt.fileName || ticket.fileName,
            size: receipt.sizeBytes || ticket.sizeBytes,
            caption: cleanCaption || undefined,
          },
        }),
      })

      const sentName = file.name
      reset()
      await onSent()
      onSuccess(
        "Pièce jointe prise en charge",
        `${sentName} a été sécurisé, attribué à votre identité AngelCare et remis au transport WhatsApp.`,
      )
    } catch (cause) {
      setPhase("selected")
      onError(
        "Envoi de la pièce jointe non terminé",
        cause instanceof Error ? cause.message : "Le fichier n’a pas pu être remis au transport WhatsApp.",
      )
    }
  }

  const type = file ? messageTypeFor(file) : "document"

  return <div className="relative">
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_FILES}
      className="sr-only"
      onChange={(event) => chooseFile(event.target.files?.[0])}
    />
    <button
      type="button"
      disabled={disabled || phase !== "idle"}
      onClick={() => inputRef.current?.click()}
      title={disabled ? "Les pièces jointes sont disponibles uniquement en mode Message client" : "Joindre une image, vidéo, audio, PDF ou document"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black transition",
        disabled
          ? "cursor-not-allowed text-slate-400"
          : "text-slate-800 hover:bg-sky-50 hover:text-sky-950",
      )}
    >
      <Paperclip className="h-3.5 w-3.5" />Joindre
    </button>

    {phase !== "idle" && file ? <div className="absolute bottom-12 left-0 z-50 w-[min(470px,86vw)] rounded-[24px] border border-slate-300 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Secure Attachment Studio</p>
          <h3 className="mt-1 text-sm font-black text-slate-950">
            {phase === "uploading"
              ? "Téléversement sécurisé"
              : phase === "sending"
                ? "Transmission OpenWA"
                : "Prévisualisation avant envoi"}
          </h3>
        </div>
        <span className="rounded-full border border-sky-300 bg-sky-100 px-3 py-1 text-[8px] font-black text-sky-950">
          {humanBytes(file.size)}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {type === "image" && previewUrl ? <img src={previewUrl} alt={file.name} className="max-h-64 w-full object-contain" /> : null}
        {type === "video" && previewUrl ? <video src={previewUrl} controls preload="metadata" className="max-h-64 w-full bg-slate-950" /> : null}
        {type === "audio" && previewUrl ? <div className="p-4"><audio src={previewUrl} controls preload="metadata" className="w-full" /></div> : null}
        {type === "document" ? <div className="flex items-center gap-3 p-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><FileKindIcon type={type} /></div>
          <div className="min-w-0"><p className="truncate text-[11px] font-black text-slate-950">{file.name}</p><p className="mt-1 text-[8px] font-semibold text-slate-600">{file.type || "Document"} · {humanBytes(file.size)}</p></div>
        </div> : null}
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-[8px] font-black uppercase tracking-[.12em] text-slate-600">Légende facultative</span>
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          rows={2}
          disabled={phase !== "selected"}
          placeholder="Ajoutez un contexte clair au fichier…"
          className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-600 disabled:bg-slate-100"
        />
      </label>

      {phase === "uploading" || phase === "sending" ? <div className="mt-3 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-sky-800" />
        <div><p className="text-[9px] font-black text-slate-950">{phase === "uploading" ? "Sécurisation du fichier…" : "Remise au transport WhatsApp…"}</p><p className="mt-1 text-[8px] font-semibold text-slate-600">Ne fermez pas la conversation pendant cette opération.</p></div>
      </div> : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={phase !== "selected"}
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[8px] font-black text-slate-900 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />Annuler
        </button>
        <button
          type="button"
          disabled={phase !== "selected"}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[8px] font-black text-slate-900 disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />Remplacer
        </button>
        <button
          type="button"
          disabled={phase !== "selected"}
          onClick={() => void sendAttachment()}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-[8px] font-black text-white disabled:opacity-50"
        >
          {phase === "selected" ? <Send className="h-3.5 w-3.5" /> : <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
          Envoyer le fichier
        </button>
      </div>
    </div> : null}
  </div>
}

export function MessageAttachmentPreview({
  message,
  inverted = false,
}: {
  message: AcWhatsAppMessage
  inverted?: boolean
}) {
  const attachment = (message.attachments || [])[0]
  const type = String(message.message_type || "document").toLowerCase() as MediaMessageType
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function resolveUrl() {
    if (url) return url
    if (!attachment?.id) throw new Error("ATTACHMENT_UNAVAILABLE")
    const resolved = await acApi<AttachmentResolution>(`/api/ac-whatsapp/attachments/${attachment.id}`)
    if (!resolved.url) throw new Error("ATTACHMENT_URL_UNAVAILABLE")
    setUrl(resolved.url)
    return resolved.url
  }

  async function openDocument() {
    if (loading) return
    setLoading(true)
    setError("")
    try {
      const resolved = await resolveUrl()
      window.open(resolved, "_blank", "noopener,noreferrer")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ATTACHMENT_UNAVAILABLE")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!["image", "video"].includes(type) || !attachment?.id) return
    let active = true
    setLoading(true)
    acApi<AttachmentResolution>(`/api/ac-whatsapp/attachments/${attachment.id}`)
      .then((resolved) => { if (active && resolved.url) setUrl(resolved.url) })
      .catch(() => { if (active) setError("Média indisponible") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attachment?.id, type])

  const frame = inverted
    ? "border-white/15 bg-white/5 text-white"
    : "border-slate-200 bg-slate-50 text-slate-950"

  if (!attachment) return <div className={cx("rounded-2xl border p-3 text-[9px] font-bold", frame)}>Pièce jointe non disponible.</div>

  return <div className={cx("overflow-hidden rounded-2xl border", frame)}>
    {loading && !url ? <div className="flex items-center gap-2 p-4 text-[9px] font-black"><LoaderCircle className="h-4 w-4 animate-spin" />Chargement sécurisé…</div> : null}
    {type === "image" && url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={attachment.file_name || "Image WhatsApp"} className="max-h-80 w-full object-contain" /></a> : null}
    {type === "video" && url ? <video src={url} controls preload="metadata" className="max-h-80 w-full bg-slate-950" /> : null}
    {type === "document" ? <button type="button" onClick={() => void openDocument()} className={cx("flex w-full items-center gap-3 p-4 text-left", inverted ? "hover:bg-white/10" : "hover:bg-slate-100")}>
      <div className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", inverted ? "bg-white/10" : "bg-slate-950 text-white")}><FileKindIcon type="document" /></div>
      <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black">{attachment.file_name || "Document WhatsApp"}</p><p className={cx("mt-1 text-[8px] font-semibold", inverted ? "text-slate-300" : "text-slate-600")}>{attachment.mime_type || "Document"} · {humanBytes(Number(attachment.size_bytes || 0))}</p></div>
      <UploadCloud className="h-4 w-4 shrink-0" />
    </button> : null}
    {error ? <p className={cx("m-3 rounded-xl border px-3 py-2 text-[8px] font-bold", inverted ? "border-rose-300/30 bg-rose-400/10 text-rose-100" : "border-rose-300 bg-rose-100 text-rose-950")}>La pièce jointe ne peut pas être chargée. Synchronisez puis réessayez.</p> : null}
  </div>
}
