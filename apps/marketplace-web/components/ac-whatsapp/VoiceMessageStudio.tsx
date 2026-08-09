"use client"

import { useEffect, useRef, useState } from "react"
import {
  Gauge, LoaderCircle, Mic, Pause, Play, RotateCcw, Send, Square, Trash2, Volume2,
} from "lucide-react"
import type { AcWhatsAppMessage } from "@/lib/ac-whatsapp/types"
import { cx } from "./ACWhatsAppUI"
import { acApi } from "./useAcWhatsApp"

const MAX_RECORDING_SECONDS = 10 * 60
const MAX_RECORDING_BYTES = 20 * 1024 * 1024
const PLAYBACK_SPEEDS = [1, 1.5, 2]

type RecorderPhase = "idle" | "recording" | "preview" | "sending"

type VoiceMessageStudioProps = {
  conversationId: string
  disabled?: boolean
  onSent: () => Promise<void> | void
  onSuccess: (title: string, description: string) => void
  onError: (title: string, description: string) => void
}

type AttachmentResolution = {
  url: string
  fileName?: string | null
  mimeType?: string | null
  expiresIn?: number
}

function formatSeconds(value: number) {
  const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
  const minutes = Math.floor(safe / 60)
  const seconds = String(safe % 60).padStart(2, "0")
  return `${minutes}:${seconds}`
}

function preferredRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return ""
  return [
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type)) || ""
}

function extensionForMime(mimeType: string) {
  const normalized = mimeType.toLowerCase()
  if (normalized.includes("ogg")) return "ogg"
  if (normalized.includes("mpeg")) return "mp3"
  if (normalized.includes("mp4")) return "m4a"
  return "webm"
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function VoiceMessageStudio({
  conversationId,
  disabled,
  onSent,
  onSuccess,
  onError,
}: VoiceMessageStudioProps) {
  const [phase, setPhase] = useState<RecorderPhase>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState("")
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const discardOnStopRef = useRef(false)

  function resetRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl("")
    setRecordedBlob(null)
    setElapsed(0)
    setPhase("idle")
    recorderRef.current = null
    stopTracks(streamRef.current)
    streamRef.current = null
    chunksRef.current = []
    discardOnStopRef.current = false
  }

  useEffect(() => () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop()
    } catch {
      // Browser recorder was already closed.
    }
    stopTracks(streamRef.current)
  }, [recordedUrl])

  useEffect(() => {
    if (phase !== "recording") return
    const timer = window.setInterval(() => {
      setElapsed((current) => {
        const next = current + 1
        if (next >= MAX_RECORDING_SECONDS) {
          window.setTimeout(() => stopRecording(), 0)
          return MAX_RECORDING_SECONDS
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  async function startRecording() {
    if (disabled || phase !== "idle") return
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError("Microphone indisponible", "Ce navigateur ne fournit pas l’enregistrement audio sécurisé requis par AC WhatsApp.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })
      streamRef.current = stream
      chunksRef.current = []
      discardOnStopRef.current = false
      setElapsed(0)

      const mimeType = preferredRecorderMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 64_000,
      })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        stopTracks(streamRef.current)
        streamRef.current = null
        setPhase("idle")
        onError("Enregistrement interrompu", "Le navigateur n’a pas pu conserver le message vocal. Réessayez après avoir vérifié le microphone.")
      }
      recorder.onstop = () => {
        stopTracks(streamRef.current)
        streamRef.current = null
        recorderRef.current = null
        if (discardOnStopRef.current) {
          chunksRef.current = []
          discardOnStopRef.current = false
          setPhase("idle")
          setElapsed(0)
          return
        }
        const finalMime = recorder.mimeType || mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: finalMime })
        chunksRef.current = []
        if (!blob.size) {
          setPhase("idle")
          onError("Message vocal vide", "Aucun son exploitable n’a été enregistré.")
          return
        }
        if (blob.size > MAX_RECORDING_BYTES) {
          setPhase("idle")
          onError("Message vocal trop volumineux", "La limite AngelCare est de 20 Mo. Enregistrez un message plus court.")
          return
        }
        if (recordedUrl) URL.revokeObjectURL(recordedUrl)
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        setPhase("preview")
      }

      recorder.start(250)
      setPhase("recording")
    } catch (cause) {
      stopTracks(streamRef.current)
      streamRef.current = null
      const permissionDenied = cause instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(cause.name)
      onError(
        permissionDenied ? "Autorisation microphone requise" : "Microphone inaccessible",
        permissionDenied
          ? "Autorisez le microphone pour opsmanagement.angelcarehub.com dans le navigateur, puis réessayez."
          : cause instanceof Error ? cause.message : "Le microphone n’a pas pu être initialisé.",
      )
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== "recording") return
    recorder.stop()
  }

  function cancelRecording() {
    discardOnStopRef.current = true
    const recorder = recorderRef.current
    if (recorder?.state === "recording") {
      recorder.stop()
      return
    }
    resetRecording()
  }

  async function sendVoiceMessage() {
    if (!recordedBlob || phase !== "preview") return
    setPhase("sending")
    try {
      const mimeType = recordedBlob.type || "audio/webm;codecs=opus"
      const extension = extensionForMime(mimeType)
      const fileName = `voice-note-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`
      const ticket = await acApi<{
        uploadUrl: string
        storageKey: string
        storageProvider: "windows"
        headers: Record<string, string>
        fileName: string
        mimeType: string
        sizeBytes: number
      }>("/api/ac-whatsapp/attachments/voice-upload", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          fileName,
          mimeType,
          sizeBytes: recordedBlob.size,
        }),
      })
      const uploadResponse = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: ticket.headers,
        body: recordedBlob,
      })
      const uploadPayload = await uploadResponse.json().catch(() => null)
      if (!uploadResponse.ok || !uploadPayload?.ok || !uploadPayload?.data) {
        throw new Error(uploadPayload?.error || `MEDIA_VAULT_UPLOAD_${uploadResponse.status}`)
      }
      const receipt = uploadPayload.data as {
        storageKey: string
        sha256: string
        sizeBytes: number
        mimeType: string
        fileName: string
      }
      await acApi("/api/ac-whatsapp/messages/send", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          messageType: "voice",
          media: {
            storageProvider: "windows",
            storageKey: receipt.storageKey,
            storagePath: receipt.storageKey,
            sha256: receipt.sha256,
            mimetype: receipt.mimeType || mimeType,
            filename: receipt.fileName || fileName,
            size: receipt.sizeBytes || recordedBlob.size,
            ptt: true,
          },
        }),
      })
      resetRecording()
      await onSent()
      onSuccess("Message vocal pris en charge", "Le message vocal a été attribué à votre identité AngelCare et remis au transport WhatsApp.")
    } catch (cause) {
      setPhase("preview")
      onError("Envoi vocal non terminé", cause instanceof Error ? cause.message : "Le message vocal n’a pas pu être remis à OpenWA.")
    }
  }

  return <div className="relative">
    <button
      type="button"
      onClick={() => void startRecording()}
      disabled={disabled || phase !== "idle"}
      title={disabled ? "Les messages vocaux sont disponibles uniquement en mode Message client" : "Enregistrer un message vocal"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black transition",
        disabled ? "cursor-not-allowed text-slate-400" : "text-slate-800 hover:bg-emerald-50 hover:text-emerald-900",
      )}
    >
      <Mic className="h-3.5 w-3.5" />Message vocal
    </button>

    {phase !== "idle" ? <div className="absolute bottom-12 left-0 z-50 w-[min(430px,82vw)] rounded-[24px] border border-slate-300 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Voice Message Studio</p>
          <h3 className="mt-1 text-sm font-black text-slate-950">{phase === "recording" ? "Enregistrement sécurisé" : phase === "sending" ? "Transmission OpenWA" : "Prévisualisation avant envoi"}</h3>
        </div>
        <span className={cx("rounded-full px-3 py-1 text-[8px] font-black", phase === "recording" ? "bg-rose-100 text-rose-950 ring-1 ring-rose-300" : "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-300")}>{formatSeconds(elapsed)}</span>
      </div>

      {phase === "recording" ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div className="flex items-center gap-3">
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-rose-600 text-white"><Mic className="h-5 w-5" /><span className="absolute inset-0 animate-ping rounded-2xl bg-rose-500/30" /></span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-slate-950">Le microphone est actif</p><p className="mt-1 text-[8px] font-semibold text-slate-600">Parlez clairement. Durée maximale : 10 minutes.</p></div>
        </div>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">{Array.from({ length: 22 }).map((_, index) => <span key={index} className="h-2 flex-1 animate-pulse rounded-full bg-rose-400" style={{ animationDelay: `${index * 45}ms`, height: `${8 + ((index * 7) % 22)}px` }} />)}</div>
        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={cancelRecording} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[8px] font-black text-slate-900"><Trash2 className="h-3.5 w-3.5" />Annuler</button><button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-[8px] font-black text-white"><Square className="h-3.5 w-3.5 fill-current" />Terminer</button></div>
      </div> : null}

      {(phase === "preview" || phase === "sending") && recordedUrl ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <audio src={recordedUrl} controls preload="metadata" className="w-full" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[8px] font-semibold text-slate-600">Écoutez avant l’envoi. Le contact recevra une véritable note vocale WhatsApp.</p><div className="flex gap-2"><button type="button" disabled={phase === "sending"} onClick={resetRecording} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[8px] font-black text-slate-900 disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Recommencer</button><button type="button" disabled={phase === "sending"} onClick={() => void sendVoiceMessage()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-[8px] font-black text-white disabled:opacity-60">{phase === "sending" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{phase === "sending" ? "Envoi…" : "Envoyer le vocal"}</button></div></div>
      </div> : null}
    </div> : null}
  </div>
}

export function VoiceMessagePlayer({ message, inverted = false }: { message: AcWhatsAppMessage; inverted?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(0)
  const [error, setError] = useState("")

  const attachment = (message.attachments || []).find((item) => {
    const mime = String(item.mime_type || "").toLowerCase()
    return mime.startsWith("audio/") || ["voice", "audio"].includes(message.message_type.toLowerCase())
  })

  useEffect(() => () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ""
    }
  }, [])

  async function resolveUrl() {
    if (url) return url
    if (!attachment?.id) throw new Error("AUDIO_ATTACHMENT_UNAVAILABLE")
    const resolved = await acApi<AttachmentResolution>(`/api/ac-whatsapp/attachments/${attachment.id}`)
    if (!resolved.url) throw new Error("AUDIO_URL_UNAVAILABLE")
    setUrl(resolved.url)
    return resolved.url
  }

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio || loading) return
    setError("")
    if (playing) {
      audio.pause()
      return
    }
    setLoading(true)
    try {
      const resolvedUrl = await resolveUrl()
      if (audio.src !== resolvedUrl) audio.src = resolvedUrl
      audio.playbackRate = PLAYBACK_SPEEDS[speedIndex]
      await audio.play()
    } catch (cause) {
      setError(cause instanceof Error && cause.message.includes("ATTACHMENT_BINARY_UNAVAILABLE")
        ? "Le média n’est plus disponible dans le runtime OpenWA."
        : "Lecture vocale indisponible. Réessayez après synchronisation.")
    } finally {
      setLoading(false)
    }
  }

  function changeSpeed() {
    const next = (speedIndex + 1) % PLAYBACK_SPEEDS.length
    setSpeedIndex(next)
    if (audioRef.current) audioRef.current.playbackRate = PLAYBACK_SPEEDS[next]
  }

  return <div className={cx("rounded-2xl border p-3", inverted ? "border-white/15 bg-white/10" : "border-emerald-200 bg-emerald-50")}>
    <audio
      ref={audioRef}
      preload="metadata"
      onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setCurrentTime(0) }}
    />
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => void togglePlay()} className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", inverted ? "bg-white text-slate-950" : "bg-emerald-700 text-white")} aria-label={playing ? "Mettre en pause" : "Lire le message vocal"}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button>
      <div className="min-w-0 flex-1">
        <div className="flex h-8 items-center gap-1" aria-hidden="true">{Array.from({ length: 28 }).map((_, index) => <span key={index} className={cx("w-1 rounded-full", inverted ? "bg-sky-200/70" : "bg-emerald-500/70")} style={{ height: `${7 + ((index * 11) % 22)}px` }} />)}</div>
        <input type="range" min={0} max={duration || 1} step={0.1} value={Math.min(currentTime, duration || 0)} onChange={(event) => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = value; setCurrentTime(value) }} className="h-1 w-full cursor-pointer accent-emerald-600" aria-label="Position du message vocal" />
        <div className={cx("mt-1 flex items-center justify-between text-[8px] font-black", inverted ? "text-slate-300" : "text-slate-600")}><span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span><span className="inline-flex items-center gap-1"><Volume2 className="h-3 w-3" />Message vocal</span></div>
      </div>
      <button type="button" onClick={changeSpeed} className={cx("inline-flex h-8 min-w-12 items-center justify-center gap-1 rounded-xl px-2 text-[8px] font-black", inverted ? "border border-white/20 bg-white/10 text-white" : "border border-emerald-300 bg-white text-emerald-950")} title="Vitesse de lecture"><Gauge className="h-3 w-3" />{PLAYBACK_SPEEDS[speedIndex]}×</button>
    </div>
    {error ? <p className={cx("mt-2 rounded-lg px-2 py-1 text-[8px] font-bold", inverted ? "bg-rose-100 text-rose-950" : "border border-rose-200 bg-rose-50 text-rose-950")}>{error}</p> : null}
  </div>
}
