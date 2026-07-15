import Link from 'next/link'
import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360PaymentReminders } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceRemindersPage() {
  const context = await getAngelcare360FinanceContext()
  const reminders = await listAngelcare360PaymentReminders({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Relances"
      subtitle="Relances planifiées, envoyées ou bloquées selon la disponibilité du canal de notification."
      badge="Disponible"
      statusLabel={`${reminders.length} relance(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
    >
      {reminders.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune relance"
          description="Aucune relance de paiement n’est encore planifiée."
          actionLabel="Voir les factures en retard"
          actionHref="/angelcare-360-command-center/finance/factures"
        />
      ) : (
        <Angelcare360FinanceDataTable
          title="Relances de paiement"
          description="L’envoi réel reste verrouillé tant que le module Messagerie n’est pas actif."
          rows={reminders}
          emptyTitle="Aucune relance"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'reminder_code', label: 'Code', render: (row) => row.reminder_code },
            { key: 'invoice', label: 'Facture', render: (row) => row.invoice_number || '—' },
            { key: 'student', label: 'Élève', render: (row) => row.student_full_name || '—' },
            { key: 'scheduled', label: 'Planifiée', render: (row) => row.scheduled_for },
            { key: 'status', label: 'Statut', render: (row) => row.status },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

