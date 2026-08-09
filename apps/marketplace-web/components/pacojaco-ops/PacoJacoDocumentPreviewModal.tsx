'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  MessageCircleMore,
  PencilLine,
  Printer,
  X,
} from 'lucide-react'
import PacoJacoA4PrintDocument from './PacoJacoA4PrintDocument'
import { formatMoney } from '@/lib/pacojaco-ops/calculations'
import {
  buildPacojacoInterventionDisplayRows,
  buildPacojacoPrintableDocument,
  pacojacoDocumentDocumentLabel,
} from '@/lib/pacojaco-ops/presentation'
import { normalizeMoroccanPhone } from '@/lib/pacojaco-ops/dispatch'
import type { PacojacoDocumentRow } from '@/lib/pacojaco-ops/types'

type Props = {
  open: boolean
  document: PacojacoDocumentRow | null
  hasLogo?: boolean
  onClose: () => void
  onEdit: (document: PacojacoDocumentRow) => void
}

type ActionState = 'email' | 'whatsapp' | 'download' | 'print' | null

function displayDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function displayList(values: Array<string | null | undefined>) {
  return values.filter((value) => String(value || '').trim()).join(' • ') || '—'
}

function getPdfFilename(documentNumber: string) {
  const safe = String(documentNumber || 'pacojaco-document')
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `${safe || 'pacojaco-document'}.pdf`
}

function buildWhatsAppMessage(document: PacojacoDocumentRow) {
  const label = pacojacoDocumentDocumentLabel(document.document_type).toLowerCase()
  return [
    `Hello ${document.client_name || 'Client'}, please find your ${label} ${document.document_number} from Angel Care.`,
    '',
    `Total amount: ${Number(document.total_ttc || 0).toFixed(2)} ${document.currency || 'MAD'}`,
    `Remaining amount: ${Number(document.remaining_amount || 0).toFixed(2)} ${document.currency || 'MAD'}`,
    '',
    'The PDF document has been generated for your review.',
    'Thank you.',
  ].join('\n')
}

async function fetchDispatch(documentId: string, payload: Record<string, any>) {
  await fetch(`/api/pacojaco-ops/documents/${documentId}/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => null)
}

async function fetchPdf(documentId: string) {
  const response = await fetch(`/api/pacojaco-ops/documents/${documentId}/pdf`, { cache: 'no-store' })
  if (!response.ok) {
    let message = `PDF generation failed (${response.status})`
    try {
      const payload = await response.json()
      message = payload?.error || payload?.message || message
    } catch {
      const text = await response.text().catch(() => '')
      if (text.trim()) message = text.trim()
    }
    throw new Error(message)
  }

  return response.blob()
}

export default function PacoJacoDocumentPreviewModal({ open, document, hasLogo = true, onClose, onEdit }: Props) {
  const [scale, setScale] = useState(1)
  const [busyAction, setBusyAction] = useState<ActionState>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [pdfWarning, setPdfWarning] = useState<string | null>(null)

  const printable = useMemo(() => (document ? buildPacojacoPrintableDocument(document) : null), [document])
  const interventionRows = useMemo(() => (document ? buildPacojacoInterventionDisplayRows(document) : []), [document])
  const emailMissing = !String(document?.client_email || '').trim()
  const phoneNormalized = normalizeMoroccanPhone(document?.client_phone || '')
  const phoneMissing = !phoneNormalized
  const documentLabel = document ? pacojacoDocumentDocumentLabel(document.document_type) : 'Document'

  useEffect(() => {
    setBusyAction(null)
    setMessage(null)
    setPdfWarning(null)
  }, [document?.id, open])

  useEffect(() => {
    function updateScale() {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200
      const safeWidth = Math.max(320, width - 48)
      const scaleValue = Math.min(1, safeWidth / 840)
      setScale(Number.isFinite(scaleValue) ? scaleValue : 1)
    }

    if (!open) return
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    window.document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.document.body.style.overflow = ''
    }
  }, [onClose, open])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 5000)
    return () => window.clearTimeout(timer)
  }, [message])

  if (!open || !document || !printable) return null

  const currentDocument = document

  async function withAction(action: ActionState, task: () => Promise<void>) {
    try {
      setBusyAction(action)
      setMessage(null)
      await task()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'An unexpected error occurred.' })
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDownloadPdf() {
    await withAction('download', async () => {
      const blob = await fetchPdf(currentDocument.id)
      const fileName = getPdfFilename(currentDocument.document_number)
      const url = URL.createObjectURL(blob)

      try {
        const anchor = window.document.createElement('a')
        anchor.href = url
        anchor.download = fileName
        anchor.rel = 'noopener'
        window.document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.open(url, '_blank', 'noopener')
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }

      await fetchDispatch(currentDocument.id, {
        channel: 'download',
        status: 'completed',
        recipient: currentDocument.client_email || null,
        message: `PDF downloaded for ${currentDocument.document_number}`,
        payload: {
          document_number: currentDocument.document_number,
          document_type: currentDocument.document_type,
          file_name: fileName,
        },
      })
      setMessage({ kind: 'success', text: 'PDF downloaded.' })
    })
  }

  async function handlePrint() {
    await withAction('print', async () => {
      await fetchDispatch(currentDocument.id, {
        channel: 'print',
        status: 'completed',
        recipient: currentDocument.client_email || null,
        message: `Print opened for ${currentDocument.document_number}`,
        payload: {
          document_number: currentDocument.document_number,
          document_type: currentDocument.document_type,
        },
      })
      window.print()
      setMessage({ kind: 'success', text: 'Print dialog opened.' })
    })
  }

  async function handleSendEmail() {
    if (emailMissing) {
      setMessage({ kind: 'error', text: 'Client email is missing. Email was not sent.' })
      return
    }

    await withAction('email', async () => {
      const response = await fetch(`/api/pacojaco-ops/documents/${currentDocument.id}/send-email`, {
        method: 'POST',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        if (response.status === 501) {
          setMessage({ kind: 'error', text: payload?.error || 'Email sending is not configured yet. PDF generated endpoint is available.' })
          setPdfWarning('Email sending is not configured yet.')
          return
        }
        throw new Error(payload?.error || payload?.message || 'Unable to send email.')
      }

      setMessage({ kind: 'success', text: payload?.message || 'Email sent successfully.' })
    })
  }

  async function handleWhatsApp() {
    if (phoneMissing || !phoneNormalized) {
      setMessage({ kind: 'error', text: 'Client phone is missing or not normalized for Morocco. WhatsApp was not opened.' })
      return
    }

    await withAction('whatsapp', async () => {
      const blob = await fetchPdf(currentDocument.id)
      const messageText = buildWhatsAppMessage(currentDocument)
      const fileName = getPdfFilename(currentDocument.document_number)
      const file = new File([blob], fileName, { type: 'application/pdf' })
      const note = 'PDF generated. Please attach the downloaded PDF if WhatsApp does not attach it automatically.'
      let shared = false

      const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && typeof navigator.share === 'function'
      if (canShareFiles) {
        try {
          shared = navigator.canShare({ files: [file] })
        } catch {
          shared = false
        }
      }

      if (shared && navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: `${documentLabel} ${currentDocument.document_number}`,
            text: messageText,
          })
          await fetchDispatch(currentDocument.id, {
            channel: 'whatsapp',
            status: 'completed',
            recipient: phoneNormalized,
            message: `Shared via Web Share for ${currentDocument.document_number}`,
            payload: {
              document_number: currentDocument.document_number,
              document_type: currentDocument.document_type,
              share_mode: 'web_share_files',
              file_name: fileName,
            },
          })
          setMessage({ kind: 'success', text: 'WhatsApp share opened with PDF attachment.' })
          return
        } catch {
          shared = false
        }
      }

      const url = URL.createObjectURL(blob)
      try {
        const anchor = window.document.createElement('a')
        anchor.href = url
        anchor.download = fileName
        anchor.rel = 'noopener'
        window.document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.open(url, '_blank', 'noopener')
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }

      const whatsappUrl = `https://wa.me/${phoneNormalized}?text=${encodeURIComponent(messageText)}`
      window.open(whatsappUrl, '_blank', 'noopener')

      await fetchDispatch(currentDocument.id, {
        channel: 'whatsapp',
        status: 'completed',
        recipient: phoneNormalized,
        message: `WhatsApp opened for ${currentDocument.document_number}`,
        payload: {
          document_number: currentDocument.document_number,
          document_type: currentDocument.document_type,
          share_mode: 'fallback_download_and_deeplink',
          file_name: fileName,
          note,
        },
      })

      setPdfWarning(note)
      setMessage({ kind: 'info', text: note })
    })
  }

  const warnings = [
    emailMissing ? 'Client email is missing.' : null,
    phoneMissing ? 'Client phone is missing or cannot be normalized to a Moroccan WhatsApp number.' : null,
    pdfWarning,
  ].filter(Boolean) as string[]

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col md:p-4">
        <section className="flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_30px_120px_rgba(15,23,42,0.28)] md:rounded-[32px]">
          <header className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_48%,#eef6ff_100%)] px-4 py-4 md:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-slate-500">Premium preview</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 md:text-2xl">
                    {documentLabel} {currentDocument.document_number}
                  </h2>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700">
                    {currentDocument.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                  Saved document preview synced to the current record, client profile, items, interventions, totals, and status.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {message ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  message.kind === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : message.kind === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : 'border-blue-200 bg-blue-50 text-blue-800'
                }`}
              >
                {message.kind === 'success' ? <CheckCircle2 className="mr-2 inline h-4 w-4" /> : message.kind === 'error' ? <AlertTriangle className="mr-2 inline h-4 w-4" /> : null}
                {message.text}
              </div>
            ) : null}

            {warnings.length ? (
              <div className="mt-4 grid gap-2">
                {warnings.map((warning) => (
                  <div key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    <AlertTriangle className="mr-2 inline h-4 w-4" />
                    {warning}
                  </div>
                ))}
              </div>
            ) : null}
          </header>

          <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.28fr)_420px]">
            <div className="overflow-auto bg-slate-100 p-3 md:p-5">
              <div className="mx-auto w-fit">
                <div
                  className="paco-a4-preview-scale"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    width: '210mm',
                    margin: '0 auto',
                  }}
                >
                  <PacoJacoA4PrintDocument document={printable} hasLogo={hasLogo} />
                </div>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col overflow-hidden border-t border-slate-200 bg-white lg:border-l lg:border-t-0">
              <div className="flex-1 overflow-auto px-4 py-4 md:px-5">
                <div className="grid gap-4">
                  <Card title="Full Summary" kicker="Document snapshot">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile label="Type" value={documentLabel} />
                      <InfoTile label="Status" value={currentDocument.status.replace(/_/g, ' ')} />
                      <InfoTile label="Number" value={currentDocument.document_number} />
                      <InfoTile label="Issue date" value={displayDate(currentDocument.issue_date)} />
                      <InfoTile label="Currency" value={currentDocument.currency || 'MAD'} />
                      <InfoTile label="Remaining" value={formatMoney(currentDocument.remaining_amount, currentDocument.currency)} />
                    </div>
                    {currentDocument.object ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">{currentDocument.object}</p> : null}
                  </Card>

                  <Card title="Client Details" kicker="Contact + billing">
                    <div className="grid gap-3">
                      <InfoRow label="Client" value={currentDocument.client_name} />
                      <InfoRow label="Company" value={currentDocument.client_company || '—'} />
                      <InfoRow label="ICE" value={currentDocument.client_ice || '—'} />
                      <InfoRow label="Email" value={currentDocument.client_email || '—'} />
                      <InfoRow label="Phone" value={currentDocument.client_phone || '—'} />
                      <InfoRow label="Address" value={currentDocument.client_address || '—'} />
                      <InfoRow label="Region" value={displayList([currentDocument.region, currentDocument.zone])} />
                      <InfoRow label="Contact" value={displayList([currentDocument.contact_name, currentDocument.child_name])} />
                    </div>
                  </Card>

                  <Card title="Intervention Details" kicker="Service context">
                    <div className="grid gap-2">
                      {interventionRows.map((row, index) => (
                        <div key={`${row.summary}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-sm font-black text-slate-900">{row.summary}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Items Summary" kicker={`${printable.items.length} line items`}>
                    <div className="grid gap-2">
                      {printable.items.length ? (
                        printable.items.map((item, index) => (
                          <div key={`${item.ref || item.designation}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-black text-slate-900">{item.designation}</div>
                                <div className="mt-1 text-xs font-medium text-slate-500">
                                  {item.ref || '—'} • {item.category || 'SVC'} • Qty {item.quantity}
                                </div>
                              </div>
                              <div className="shrink-0 text-sm font-black text-slate-900">{formatMoney(item.total, printable.currency)}</div>
                            </div>
                            {item.description ? <div className="mt-2 text-xs font-medium leading-5 text-slate-500">{item.description}</div> : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">No items connected yet.</div>
                      )}
                    </div>
                  </Card>

                  <Card title="Totals" kicker="Financials">
                    <div className="grid gap-2">
                      <AmountRow label="Subtotal" value={formatMoney(printable.subtotal, printable.currency)} />
                      <AmountRow label="Discount" value={formatMoney(printable.discount_total, printable.currency)} />
                      <AmountRow label="Advance" value={formatMoney(printable.advance_amount, printable.currency)} />
                      <AmountRow label="Remaining" value={formatMoney(printable.remaining_amount, printable.currency)} />
                    </div>
                    <div className="mt-4 rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-300">Total TTC</div>
                      <div className="mt-2 text-3xl font-black tracking-tight">{formatMoney(printable.total_ttc, printable.currency)}</div>
                    </div>
                  </Card>

                  <Card title="Status" kicker="Live document state">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile label="Document state" value={currentDocument.status.replace(/_/g, ' ')} />
                      <InfoTile label="Saved at" value={displayDate(currentDocument.updated_at)} />
                      <InfoTile label="Payment method" value={currentDocument.payment_method || '—'} />
                      <InfoTile label="Payment date" value={displayDate(currentDocument.payment_date)} />
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
                      {currentDocument.conditions || 'No conditions recorded.'}
                    </div>
                  </Card>
                </div>
              </div>

              <footer className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-5">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleSendEmail()}
                    disabled={busyAction !== null || emailMissing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send via Email
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleWhatsApp()}
                    disabled={busyAction !== null || phoneMissing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === 'whatsapp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircleMore className="h-4 w-4" />}
                    Send via WhatsApp
                  </button>
                  <button
                    type="button"
                      onClick={() => {
                      onClose()
                      onEdit(currentDocument)
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePrint()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    {busyAction === 'print' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    {busyAction === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                </div>
                <div className="mt-3 text-[11px] font-medium text-slate-400">
                  Web Share with file attachments is used when available. Otherwise the PDF downloads/opens first and WhatsApp opens with the message prefilled.
                </div>
              </footer>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}

function Card({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">{title}</div>
          {kicker ? <div className="mt-1 text-sm font-semibold text-slate-400">{kicker}</div> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="max-w-[65%] text-right text-sm font-bold text-slate-900">{value}</div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  )
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="text-sm font-black text-slate-900">{value}</div>
    </div>
  )
}
