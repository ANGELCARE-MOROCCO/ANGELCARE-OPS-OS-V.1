import { notFound } from 'next/navigation'
import Angelcare360OperatorLockedPanel from '@/components/angelcare360/operator/Angelcare360OperatorLockedPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { getOperatorSettings } from '@/lib/angelcare360/operator/settings'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorSettingsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const settings = await getOperatorSettings()

  return (
    <Angelcare360OperatorPageShell
      badge="Paramètres opérateur"
      statusLabel="Configuration interne"
      title="Paramètres opérateur"
      subtitle="Verrous d’infrastructure, préparation des rôles et réglages de base pour l’équipe AngelCare."
    >
      <Angelcare360OperatorLockedPanel
        title="Infrastructures verrouillées"
        message={settings.notes.join(' ')}
        note="Le portail opérateur reste en lecture/gestion interne tant que les canaux externes ne sont pas validés."
      />
      <section style={gridStyle}>
        <article style={cardStyle}>
          <div style={labelStyle}>Documents A4</div>
          <Angelcare360OperatorStatusBadge status={settings.invoicePdfA4Active ? 'enabled' : 'locked'} />
          <p style={textStyle}>Impression PDF navigateur: {settings.invoicePdfA4Active ? 'active' : 'verrouillée'}</p>
          <p style={textStyle}>PDF serveur: {settings.serverPdfBinaryActive ? 'actif' : 'verrouillé'}</p>
        </article>
        <article style={cardStyle}>
          <div style={labelStyle}>Exports CSV / XLSX</div>
          <Angelcare360OperatorStatusBadge status={settings.csvExportActive ? 'enabled' : 'locked'} />
          <p style={textStyle}>CSV: {settings.csvExportActive ? 'actif' : 'verrouillé'}</p>
          <p style={textStyle}>XLSX: {settings.xlsxExportLocked ? 'verrouillé' : 'actif'}</p>
        </article>
        <article style={cardStyle}>
          <div style={labelStyle}>Email-OS B2B</div>
          <Angelcare360OperatorStatusBadge status={settings.emailBridgeAvailable ? 'enabled' : 'locked'} />
          <p style={textStyle}>Boîte: {settings.emailMailbox}</p>
          <p style={textStyle}>Envoi automatique: {settings.emailAutomationLocked ? 'verrouillé' : 'actif'}</p>
        </article>
        <article style={cardStyle}>
          <div style={labelStyle}>Paiement</div>
          <Angelcare360OperatorStatusBadge status={settings.paymentGateManualControlActive ? 'enabled' : 'locked'} />
          <p style={textStyle}>Gating paiement manuel: {settings.paymentGateManualControlActive ? 'actif' : 'verrouillé'}</p>
          <p style={textStyle}>Passerelle en ligne: {settings.onlinePaymentProviderConfigured ? 'connectée' : 'verrouillée'}</p>
        </article>
        <article style={cardStyle}>
          <div style={labelStyle}>Communication</div>
          <Angelcare360OperatorStatusBadge status={settings.smsLocked || settings.whatsappLocked ? 'locked' : 'enabled'} />
          <p style={textStyle}>SMS: {settings.smsLocked ? 'verrouillé' : 'actif'}</p>
          <p style={textStyle}>WhatsApp: {settings.whatsappLocked ? 'verrouillé' : 'actif'}</p>
        </article>
        <article style={cardStyle}>
          <div style={labelStyle}>Rôles opérateur</div>
          <Angelcare360OperatorStatusBadge status={settings.roleReadiness.super_admin ? 'enabled' : 'locked'} />
          <p style={textStyle}>Super Admin: {settings.roleReadiness.super_admin ? 'prêt' : 'à compléter'}</p>
          <p style={textStyle}>Lecture seule: {settings.roleReadiness.read_only ? 'disponible' : 'à compléter'}</p>
        </article>
      </section>
    </Angelcare360OperatorPageShell>
  )
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  display: 'grid',
  gap: 10,
}

const labelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}
