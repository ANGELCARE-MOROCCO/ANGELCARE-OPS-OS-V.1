'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Angelcare360OperatorActionButton from './Angelcare360OperatorActionButton'
import Angelcare360OperatorConfirmPanel from './Angelcare360OperatorConfirmPanel'
import Angelcare360OperatorDrawer from './Angelcare360OperatorDrawer'
import Angelcare360OperatorMutationBanner from './Angelcare360OperatorMutationBanner'

type Props = {
  invoiceId: string
  invoiceNumber: string
  clientId: string
  clientLabel: string
  recipientEmail?: string | null
  emailBridgeAvailable: boolean
  balanceDueMad: number
  dueDate?: string | null
  gateCode: string
  subscriptionId?: string | null
  tenantId?: string | null
  hasActiveGate?: boolean
}

type PendingAction = 'send-email' | 'create-gate' | null

type BannerState = { kind: 'idle' | 'loading' | 'success' | 'error'; message: string | null }

export default function Angelcare360OperatorInvoiceRowActions({
  invoiceId,
  invoiceNumber,
  clientId,
  clientLabel,
  recipientEmail,
  emailBridgeAvailable,
  balanceDueMad,
  dueDate,
  gateCode,
  subscriptionId,
  tenantId,
  hasActiveGate,
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
  const gateDisabledReason = hasActiveGate
    ? 'Un gate paiement existe déjà pour cette facture.'
    : balanceDueMad <= 0
      ? 'Le solde est nul, aucun gate nécessaire.'
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
      if (pendingAction === 'send-email') {
        await postJson('/api/angelcare360/operator/billing', {
          entity: 'email',
          operation: 'invoice',
          payload: {
            id: invoiceId,
            recipientEmail: recipientEmail || undefined,
          },
        })
        setBanner({ kind: 'success', message: 'Facture envoyée par email.' })
      } else {
        await postJson('/api/angelcare360/operator/payment-gates', {
          operation: 'create',
          payload: {
            clientId,
            tenantId: tenantId || undefined,
            invoiceId,
            subscriptionId: subscriptionId || undefined,
            gateCode,
            status: 'active',
            amountDueMad: balanceDueMad,
            currency: 'MAD',
            reason: `Facture ${invoiceNumber} en attente de règlement.`,
            dueDate: dueDate || undefined,
            blocking: true,
            providerKey: null,
            checkoutUrl: null,
            onlinePaymentReference: null,
          },
        })
        setBanner({ kind: 'success', message: 'Gate de paiement créé.' })
      }
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
        <Link href={`/angelcare-360-operator/billing/invoices/${invoiceId}/print`} style={linkStyle}>
          A4 / imprimer
        </Link>
        <Angelcare360OperatorActionButton
          label="Envoyer facture"
          tone="secondary"
          disabled={Boolean(emailDisabledReason)}
          disabledReason={emailDisabledReason}
          onClick={() => setPendingAction('send-email')}
        />
        <Angelcare360OperatorActionButton
          label="Créer gate paiement"
          tone="primary"
          disabled={Boolean(gateDisabledReason)}
          disabledReason={gateDisabledReason}
          onClick={() => setPendingAction('create-gate')}
        />
      </div>

      <Angelcare360OperatorMutationBanner kind={banner.kind} message={banner.message} />

      {pendingAction ? (
        <Angelcare360OperatorDrawer
          open
          title={pendingAction === 'send-email' ? 'Envoyer facture email' : 'Créer gate paiement'}
          subtitle={pendingAction === 'send-email'
            ? `Envoi de la facture ${invoiceNumber} au contact de ${clientLabel}.`
            : `Création d’un gate de paiement pour ${invoiceNumber}.`}
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
            title={pendingAction === 'send-email' ? 'Confirmation d’envoi' : 'Confirmation de gate'}
            message={pendingAction === 'send-email'
              ? `La facture sera envoyée à ${recipientEmail || 'l’adresse de facturation configurée'} pour le client ${clientLabel}.`
              : `Le gate ${gateCode} sera créé avec un montant dû de ${balanceDueMad.toLocaleString('fr-FR')} MAD et l’échéance ${dueDate || 'non renseignée'}.`}
            confirmLabel={pendingAction === 'send-email' ? 'Confirmer l’envoi' : 'Créer le gate'}
            onConfirm={() => void runCurrentAction()}
            busy={busy}
            tone={pendingAction === 'create-gate' ? 'warning' : 'warning'}
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
