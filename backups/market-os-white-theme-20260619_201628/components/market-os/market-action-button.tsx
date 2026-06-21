'use client'

import { useState } from 'react'
import { executeMarketAction } from '@/lib/market-os/client-actions'

type MarketActionButtonProps = {
  moduleKey?: string
  engine?: string
  actionKey: string
  actionLabel?: string
  label?: string
  targetId?: string | null
  targetTitle?: string | null
  objectiveId?: string | null
  recordId?: string
  payload?: Record<string, unknown>
  className?: string
  children?: React.ReactNode
}

function inferEngine(moduleKey?: string, explicitEngine?: string) {
  if (explicitEngine) return explicitEngine
  const key = (moduleKey || '').toLowerCase()
  if (key.includes('campaign') || key.includes('acquisition')) return 'acquisition'
  if (key.includes('content') || key.includes('brand') || key.includes('calendar')) return 'content'
  if (key.includes('lead') || key.includes('conversion') || key.includes('script')) return 'conversion'
  if (key.includes('seo')) return 'seo'
  if (key.includes('partner') || key.includes('ambassador') || key.includes('referral')) return 'network'
  if (key.includes('risk') || key.includes('kpi') || key.includes('performance') || key.includes('data')) return 'data'
  return 'system'
}

function inferRecordType(actionKey: string, moduleKey?: string) {
  const key = `${moduleKey || ''} ${actionKey || ''}`.toLowerCase()
  if (key.includes('campaign')) return 'campaign'
  if (key.includes('content')) return 'content_task'
  if (key.includes('lead')) return 'lead'
  if (key.includes('article') || key.includes('seo')) return 'article'
  if (key.includes('ambassador')) return 'ambassador'
  if (key.includes('partner') || key.includes('referral')) return 'partnership'
  if (key.includes('risk') || key.includes('signal')) return 'risk_signal'
  if (key.includes('optimization')) return 'optimization_task'
  if (key.includes('calendar') || key.includes('schedule')) return 'calendar_event'
  if (key.includes('approval') || key.includes('sla')) return 'approval'
  if (key.includes('offer') || key.includes('pricing')) return 'offer'
  if (key.includes('test') || key.includes('experiment')) return 'experiment'
  return 'task'
}

export default function MarketActionButton({
  moduleKey = 'market-os',
  engine,
  actionKey,
  actionLabel,
  label,
  targetId,
  targetTitle,
  objectiveId,
  recordId,
  payload = {},
  className = '',
  children,
}: MarketActionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleClick() {
    try {
      setLoading(true)
      setMessage(null)

      const finalEngine = inferEngine(moduleKey, engine)
      const recordType = inferRecordType(actionKey, moduleKey)

      const result = await executeMarketAction({
        action: actionKey,
        engine: finalEngine as any,
        recordId,
        recordType,
        title: targetTitle || actionLabel || label || actionKey.replace(/_/g, ' '),
        actorName: 'Market-OS Operator',
        payload: {
          moduleKey,
          actionLabel: actionLabel || label || actionKey,
          targetId: targetId || null,
          targetTitle: targetTitle || null,
          objectiveId: objectiveId || null,
          ...payload,
        },
      })

      setMessage(`Executed · saved ${result?.recordId ? String(result.recordId).slice(0, 8) : ''}`)
      window.dispatchEvent(new CustomEvent('market-os-action-executed', { detail: result }))
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Market-OS action failed'
      setMessage(`Failed: ${text}`)
      alert(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ||
          'rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
        }
      >
        {loading ? 'Executing...' : children || label || actionLabel || actionKey.replace(/_/g, ' ')}
      </button>

      {message && (
        <span className={message.startsWith('Failed') ? 'text-xs font-bold text-red-600' : 'text-xs font-bold text-emerald-600'}>
          {message}
        </span>
      )}
    </span>
  )
}
