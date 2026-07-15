import { requireAngelcare360OperatorPermission } from './access'
import { isAngelcare360EmailBridgeAvailable, getAngelcare360B2BMailboxEmail } from '@/lib/angelcare360/email/email-os-bridge'
import { getAngelcare360PaymentProviderStatus } from '@/lib/angelcare360/payments/provider'
import { getAngelcare360DocumentTemplate } from '@/lib/angelcare360/documents/template-registry'

export async function getOperatorSettings() {
  await requireAngelcare360OperatorPermission('operator.settings.manage')
  const paymentProvider = getAngelcare360PaymentProviderStatus()
  const emailBridgeAvailable = isAngelcare360EmailBridgeAvailable()
  const invoiceTemplate = getAngelcare360DocumentTemplate('operator-saas-invoice')
  const receiptTemplate = getAngelcare360DocumentTemplate('operator-payment-receipt')
  const statementTemplate = getAngelcare360DocumentTemplate('operator-client-statement')
  const operatorTemplates = [invoiceTemplate, receiptTemplate, statementTemplate].filter(Boolean)
  const serverPdfBinaryActive = operatorTemplates.every((template) => template?.serverPdfAvailable)
  const invoicePdfA4Active = operatorTemplates.every((template) => template?.browserPrintAvailable)
  const csvExportActive = operatorTemplates.some((template) => template?.csvAvailable)

  return {
    paymentGateManualControlActive: true,
    billingGatewayLocked: !paymentProvider.configured,
    onlinePaymentProviderConfigured: paymentProvider.configured,
    onlinePaymentProviderReason: paymentProvider.reason,
    invoicePdfLocked: !invoicePdfA4Active,
    invoicePdfA4Active,
    serverPdfBinaryActive,
    serverPdfBinaryLockedReason: serverPdfBinaryActive ? null : 'PDF serveur verrouillé : moteur documentaire requis.',
    csvExportActive,
    xlsxExportLocked: true,
    emailAutomationLocked: !emailBridgeAvailable,
    emailBridgeAvailable,
    emailMailbox: getAngelcare360B2BMailboxEmail(),
    smsLocked: true,
    whatsappLocked: true,
    featureCatalogReady: true,
    roleReadiness: {
      super_admin: true,
      operator_admin: false,
      account_manager: false,
      finance_operator: false,
      support_operator: false,
      implementation_manager: false,
      read_only: true,
    },
    notes: [
      paymentProvider.configured
        ? 'Passerelle de paiement en ligne active.'
        : 'Paiement en ligne verrouillé : passerelle non configurée.',
      invoicePdfA4Active
        ? 'Impression PDF navigateur / A4 entreprise active.'
        : 'PDF serveur verrouillé : moteur documentaire requis.',
      emailBridgeAvailable
        ? `Email-OS actif via ${getAngelcare360B2BMailboxEmail()}.`
        : 'Envoi email automatique verrouillé : infrastructure email à valider.',
      'SMS verrouillé : fournisseur non configuré.',
      'WhatsApp verrouillé : fournisseur non configuré.',
      'Signature électronique verrouillée : fournisseur non configuré.',
      'Mesure d’usage avancée indisponible : instrumentation requise.',
      'Relance externe verrouillée : canal d’envoi non configuré.',
    ],
  }
}
