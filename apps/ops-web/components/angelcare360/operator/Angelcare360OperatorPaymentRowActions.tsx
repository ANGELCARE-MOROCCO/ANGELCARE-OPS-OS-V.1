'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Angelcare360OperatorActionButton from './Angelcare360OperatorActionButton'
import Angelcare360OperatorConfirmPanel from './Angelcare360OperatorConfirmPanel'
import Angelcare360OperatorDrawer from './Angelcare360OperatorDrawer'
import Angelcare360OperatorMutationBanner from './Angelcare360OperatorMutationBanner'

type Props = {
  paymentId: string
  paymentReference: string
  recipientEmail?: string | null
  emailBridgeAvailable: boolean
}

type PendingAction = 'send-receipt' | null
type BannerState = { kind: 'idle' | 'loading' | 'success' | 'error'; message: string | null }

export default function Angelcare360OperatorPaymentRowActions({
  paymentId,
  paymentReference,
  recipientEmail,
  emailBridgeAvailable,
}: Props) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<BannerState>({ kind: 'idle', message: null })

  const emailDisabledReason = !emailBridgeAvailable
    ? 'Email-OS verrouillé : infrastructure email non validée.'
    : !recipientEmail
      ? 'Aucune adresse email de facturation disponible.'
      : null

  async function postJson(endpoint: string, body: Record<string, unknown>) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || 'Action opérateur indisponible.')
    }
    return payload
  }

  async function runCurrentAction() {
    if (!pendingAction) return
    setBusy(true)
    setBanner({ kind: 'loading', message: 'Traitement en cours…' })
    try {
      await postJson('/api/angelcare360/operator/billing', {
        entity: 'email',
        operation: 'receipt',
        payload: {
          id: paymentId,
          recipientEmail: recipientEmail || undefined,
        },
      })
      setBanner({ kind: 'success', message: 'Reçu envoyé par email.' })
      setPendingAction(null)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue.'
      setBanner({ kind: 'error', message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={wrapStyle}>
      <div style={actionsStyle}>
        <Link href={`/angelcare-360-operator/billing/payments/${paymentId}/receipt-print`} style={linkStyle}>
          Reçu A4
        </Link>
        <Angelcare360OperatorActionButton
          label="Envoyer reçu"
          tone="secondary"
          disabled={Boolean(emailDisabledReason)}
          disabledReason={emailDisabledReason}
          onClick={() => setPendingAction('send-receipt')}
        />
      </div>

      <Angelcare360OperatorMutationBanner kind={banner.kind} message={banner.message} />

      {pendingAction ? (
        <Angelcare360OperatorDrawer
          open
          title="Envoyer reçu email"
          subtitle={`Envoi du reçu du paiement ${paymentReference}.`}
          onClose={() => {
            if (busy) return
            setPendingAction(null)
            setBanner({ kind: 'idle', message: null })
          }}
          footer={
            <Angelcare360OperatorActionButton
              label="Annuler"
              tone="secondary"
              disabled={busy}
              onClick={() => {
                setPendingAction(null)
                setBanner({ kind: 'idle', message: null })
              }}
            />
          }
        >
          <Angelcare360OperatorConfirmPanel
            title="Confirmation d’envoi"
            message={`Le reçu sera envoyé à ${recipientEmail || 'l’adresse de facturation configurée'} pour le paiement ${paymentReference}.`}
            confirmLabel="Confirmer l’envoi"
            onConfirm={() => void runCurrentAction()}
            busy={busy}
            tone="warning"
          />
        </Angelcare360OperatorDrawer>
      ) : null}
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 12,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '8px 11px',
  fontWeight: 800,
}
