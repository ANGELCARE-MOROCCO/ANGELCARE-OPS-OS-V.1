'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { Angelcare360PaymentGateRecord } from '@/types/angelcare360/payment-gates'
import {
  ANGELCARE360_COLORS,
  angelcare360PageBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  gate: Angelcare360PaymentGateRecord
  providerConfigured: boolean
  providerReason: string
}

export default function Angelcare360PaymentGateOverlay({ gate, providerConfigured, providerReason }: Props) {
  const dueAmount = useMemo(() => Number(gate.amount_due_mad || 0).toLocaleString('fr-FR'), [gate.amount_due_mad])
  const dueDate = gate.due_date || '—'
  const establishmentLabel = gate.school_name || gate.client_display_name || gate.tenant_slug || gate.client_id

  return (
    <div style={overlayRootStyle} role="presentation" aria-hidden={false}>
      <div style={overlayBackdropStyle} />
      <div style={overlayCardStyle} role="dialog" aria-modal="true" aria-labelledby="angelcare360-payment-gate-title">
        <div style={eyebrowStyle}>Contrôle de paiement</div>
        <h2 id="angelcare360-payment-gate-title" style={titleStyle}>Paiement AngelCare 360 requis</h2>
        <p style={descriptionStyle}>
          L’accès au portail est temporairement suspendu tant que le règlement n’est pas validé par AngelCare.
        </p>

        <div style={summaryGridStyle}>
          <Info label="Établissement" value={String(establishmentLabel)} />
          <Info label="Référence facture" value={gate.invoice_number || gate.invoice_id || '—'} />
          <Info label="Montant dû" value={`${dueAmount} MAD`} />
          <Info label="Échéance" value={dueDate} />
          <Info label="Motif" value={gate.reason} />
          <Info label="Statut" value={String(gate.status).replace(/_/g, ' ')} />
        </div>

        <div style={calloutStyle}>
          <strong>Contact AngelCare</strong>
          <span>Le blocage ne peut pas être fermé par l’utilisateur. L’équipe AngelCare suit la validation manuelle.</span>
        </div>

        <div style={actionsStyle}>
          <button type="button" disabled={!providerConfigured} style={providerConfigured ? primaryButtonStyle : lockedButtonStyle} title={providerConfigured ? 'Paiement en ligne disponible' : providerReason}>
            {providerConfigured ? 'Paiement en ligne' : 'Passerelle de paiement non configurée.'}
          </button>
          <Link href="/angelcare-360-command-center/reclamations" style={secondaryButtonStyle}>Contacter AngelCare</Link>
        </div>

        {!providerConfigured ? <div style={lockedNoteStyle}>{providerReason}</div> : null}
        {String(gate.status) === 'manual_pending' ? (
          <div style={manualStateStyle}>Paiement manuel en cours de validation par AngelCare.</div>
        ) : null}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  )
}

const overlayRootStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  display: 'grid',
  placeItems: 'center',
  padding: 20,
  ...angelcare360PageBackdropStyle,
}

const overlayBackdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(15,23,42,.36)',
  backdropFilter: 'blur(18px)',
}

const overlayCardStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  width: 'min(760px, 100%)',
  borderRadius: 28,
  border: `1px solid ${ANGELCARE360_COLORS.blueBorder}`,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.white} 0%, ${ANGELCARE360_COLORS.background} 100%)`,
  boxShadow: '0 28px 80px rgba(15,23,42,.24)',
  padding: 28,
  display: 'grid',
  gap: 16,
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.blueDeep,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 11,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
  color: ANGELCARE360_COLORS.navy,
}

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.7,
  color: ANGELCARE360_COLORS.slate,
  fontWeight: 600,
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}

const infoCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  background: ANGELCARE360_COLORS.white,
  padding: 14,
  display: 'grid',
  gap: 6,
}

const infoLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.slateMuted,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: .8,
  fontWeight: 900,
}

const infoValueStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.navy,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.5,
}

const calloutStyle: React.CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${ANGELCARE360_COLORS.amberBorder}`,
  background: ANGELCARE360_COLORS.amberSoft,
  padding: 14,
  display: 'grid',
  gap: 4,
  color: ANGELCARE360_COLORS.amber,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
}

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_COLORS.blueDeep}`,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.blue} 0%, ${ANGELCARE360_COLORS.blueDeep} 100%)`,
  color: ANGELCARE360_COLORS.white,
  padding: '11px 16px',
  fontWeight: 900,
  cursor: 'pointer',
}

const lockedButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: ANGELCARE360_COLORS.backgroundAlt,
  borderColor: ANGELCARE360_COLORS.border,
  color: ANGELCARE360_COLORS.slateMuted,
  cursor: 'not-allowed',
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  background: ANGELCARE360_COLORS.white,
  color: ANGELCARE360_COLORS.navy,
  padding: '11px 16px',
  fontWeight: 900,
  textDecoration: 'none',
}

const lockedNoteStyle: React.CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${ANGELCARE360_COLORS.redBorder}`,
  background: ANGELCARE360_COLORS.redSoft,
  padding: 12,
  color: ANGELCARE360_COLORS.red,
  fontWeight: 700,
}

const manualStateStyle: React.CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${ANGELCARE360_COLORS.blueBorder}`,
  background: ANGELCARE360_COLORS.blueSoft,
  padding: 12,
  color: ANGELCARE360_COLORS.blueDeep,
  fontWeight: 800,
}
