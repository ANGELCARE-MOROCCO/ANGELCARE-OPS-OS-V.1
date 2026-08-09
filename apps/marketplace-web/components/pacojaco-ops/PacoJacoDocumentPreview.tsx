'use client'

import { useEffect, useMemo, useState } from 'react'
import { Printer, X } from 'lucide-react'
import PacoJacoA4PrintDocument from './PacoJacoA4PrintDocument'
import type { PacojacoPrintableDocument } from '@/lib/pacojaco-ops/types'

type Props = {
  open: boolean
  document: PacojacoPrintableDocument | null
  hasLogo?: boolean
  onClose: () => void
  onPrint?: () => void
}

export default function PacoJacoDocumentPreview({ open, document, hasLogo = true, onClose, onPrint }: Props) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function updateScale() {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200
      const safeWidth = Math.max(320, width - 48)
      const scaleValue = Math.min(1, safeWidth / 840)
      setScale(Number.isFinite(scaleValue) ? scaleValue : 1)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const scaledStyle = useMemo(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: 'top center' as const,
      width: '210mm',
      margin: '0 auto',
    }),
    [scale]
  )

  if (!open || !document) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-3 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.24)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">A4 preview</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {document.document_type === 'invoice' ? 'Facture' : 'Devis'} • {document.document_number}
            </div>
          </div>

          <div className="flex gap-2">
            {onPrint ? (
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div className="mx-auto w-fit">
            <div style={scaledStyle}>
              <PacoJacoA4PrintDocument document={document} hasLogo={hasLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

