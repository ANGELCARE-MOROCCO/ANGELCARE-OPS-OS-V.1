'use client'

import Link from 'next/link'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { QuoteCartLine } from '@/lib/b2b-marketplace/types'

type QuoteCartContextValue = {
  lines: QuoteCartLine[]
  addLine: (line: Omit<QuoteCartLine, 'lineId' | 'quantity'> & { quantity?: number }) => void
  updateQuantity: (lineId: string, quantity: number) => void
  removeLine: (lineId: string) => void
  clear: () => void
  total: number
  count: number
}

const QuoteCartContext = createContext<QuoteCartContextValue | null>(null)
const STORAGE_KEY = 'angelcare-b2b-marketplace-quote-cart'

function makeLineId(reference: string, itemType: string) {
  return `${itemType}:${reference}`.toLowerCase().replace(/[^a-z0-9:-]/g, '-')
}

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<QuoteCartLine[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setLines(JSON.parse(raw) as QuoteCartLine[])
    } catch {}
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {}
  }, [lines])

  const value = useMemo<QuoteCartContextValue>(() => {
    const total = lines.reduce((sum, line) => sum + line.quantity * line.estimatedUnitPriceMad, 0)
    const count = lines.reduce((sum, line) => sum + line.quantity, 0)

    return {
      lines,
      total,
      count,
      addLine(line) {
        setLines((current) => {
          const lineId = makeLineId(line.reference, line.itemType)
          const existing = current.find((item) => item.lineId === lineId)
          if (existing) {
            return current.map((item) =>
              item.lineId === lineId ? { ...item, quantity: item.quantity + (line.quantity || 1) } : item,
            )
          }
          return [...current, { ...line, quantity: line.quantity || 1, lineId }]
        })
      },
      updateQuantity(lineId, quantity) {
        setLines((current) => current.map((line) => (line.lineId === lineId ? { ...line, quantity: Math.max(1, quantity) } : line)))
      },
      removeLine(lineId) {
        setLines((current) => current.filter((line) => line.lineId !== lineId))
      },
      clear() {
        setLines([])
      },
    }
  }, [lines])

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>
}

export function useQuoteCart() {
  const value = useContext(QuoteCartContext)
  if (!value) throw new Error('useQuoteCart must be used inside QuoteCartProvider')
  return value
}

export function AddToQuoteButton({
  itemType,
  reference,
  title,
  estimatedUnitPriceMad,
  label = 'Ajouter au devis',
  variant = 'primary',
}: {
  itemType: QuoteCartLine['itemType']
  reference: string
  title: string
  estimatedUnitPriceMad: number
  label?: string
  variant?: 'primary' | 'soft' | 'dark'
}) {
  const cart = useQuoteCart()
  const className = variant === 'soft'
    ? 'rounded-full border border-[#dbe6f3] bg-white px-4 py-2.5 text-sm font-black text-[#092e63] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'
    : variant === 'dark'
      ? 'rounded-full bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-300/60 transition hover:-translate-y-0.5 hover:bg-[#092e63]'
      : 'rounded-full bg-[#092e63] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-[#071f44]'

  return (
    <button
      type="button"
      onClick={() => cart.addLine({ itemType, reference, title, estimatedUnitPriceMad })}
      className={className}
    >
      {label}
    </button>
  )
}

export function StickyQuoteCart() {
  const cart = useQuoteCart()
  return (
    <Link
      href="/b2b-marketplace/quote-cart"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-[#d7e3f3] bg-white/95 px-5 py-3 text-sm font-black text-[#092e63] shadow-2xl shadow-slate-300/60 backdrop-blur transition hover:-translate-y-0.5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#092e63] text-white shadow-lg shadow-blue-950/20">{cart.count}</span>
      <span>Panier B2B</span>
      <span className="hidden rounded-full bg-[#f4f7fb] px-2 py-1 text-[11px] text-slate-500 sm:inline-flex">Devis</span>
    </Link>
  )
}
