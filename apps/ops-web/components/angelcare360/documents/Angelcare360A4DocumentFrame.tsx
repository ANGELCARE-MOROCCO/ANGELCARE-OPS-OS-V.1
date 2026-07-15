"use client"

import type { ReactNode } from 'react'
import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'
import {
  ANGELCARE360_COLORS,
  angelcare360PageShellStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'
import Angelcare360A4Header from './Angelcare360A4Header'
import Angelcare360A4Footer from './Angelcare360A4Footer'
import Angelcare360A4ConfidentialityStrip from './Angelcare360A4ConfidentialityStrip'

type Props = {
  model: Angelcare360A4DocumentModel
  children: ReactNode
}

export default function Angelcare360A4DocumentFrame({ model, children }: Props) {
  return (
    <article className="angelcare360-a4-print-root" style={rootStyle}>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .angelcare360-a4-print-root,
          .angelcare360-a4-print-root * {
            visibility: visible !important;
          }

          .angelcare360-a4-print-root {
            position: fixed !important;
            inset: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      <Angelcare360A4ConfidentialityStrip confidentiality={model.confidentiality} />
      <div style={sheetStyle}>
        <Angelcare360A4Header model={model} />
        <div style={bodyStyle}>{children}</div>
        <Angelcare360A4Footer model={model} />
      </div>
    </article>
  )
}

const rootStyle: React.CSSProperties = {
  ...angelcare360PageShellStyle,
  background: ANGELCARE360_COLORS.background,
  color: ANGELCARE360_COLORS.navy,
  position: 'relative',
}

const sheetStyle: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  background: ANGELCARE360_COLORS.white,
  boxShadow: '0 24px 72px rgba(15,23,42,.10)',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0,1fr) auto',
}

const bodyStyle: React.CSSProperties = {
  padding: '16mm 14mm 14mm',
  display: 'grid',
  gap: '8mm',
}
