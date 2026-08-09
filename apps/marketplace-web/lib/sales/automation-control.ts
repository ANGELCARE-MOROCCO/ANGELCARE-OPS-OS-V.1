import { defaultSalesAutomationRules } from '@/lib/sales/automation-rules'
import type { SalesAutomationAlert, SalesAutomationQueueItem } from '@/types/sales/automation'

export function buildSalesAutomationControlSnapshot() {
  const queue: SalesAutomationQueueItem[] = [
    {
      id: 'queue-payment-pressure-001',
      dealRef: 'DEAL-PAYMENT-PENDING',
      title: 'Payment promise requires immediate follow-up',
      requiredAction: 'Call client, confirm payment method, and update payment promise status before SLA breach.',
      owner: 'Sales Agent',
      priority: 'urgent',
      status: 'open',
      sla: '2h',
    },
    {
      id: 'queue-discount-approval-001',
      dealRef: 'DEAL-DISCOUNT-RISK',
      title: 'Discount request above safe threshold',
      requiredAction: 'Manager must approve, reject, or replace with value-added offer.',
      owner: 'Sales Manager',
      priority: 'high',
      status: 'blocked',
      sla: '4h',
    },
    {
      id: 'queue-handoff-quality-001',
      dealRef: 'DEAL-ACTIVATION-CHECK',
      title: 'Fulfillment handoff missing activation details',
      requiredAction: 'Complete client constraints, service start date, payment proof, and operational notes.',
      owner: 'Closing Owner',
      priority: 'high',
      status: 'open',
      sla: '6h',
    },
  ]

  const alerts: SalesAutomationAlert[] = [
    {
      id: 'alert-stalled-closing',
      title: 'Closing stage stalled',
      severity: 'critical',
      message: 'A high-value deal stayed in negotiation beyond the configured delay.',
      recommendedAction: 'Escalate to CEO intervention queue or launch emergency closing mode.',
    },
    {
      id: 'alert-payment-risk',
      title: 'Payment risk detected',
      severity: 'high',
      message: 'Client verbally agreed but no payment confirmation was recorded.',
      recommendedAction: 'Trigger payment pressure sequence and send payment confirmation script.',
    },
    {
      id: 'alert-activation-risk',
      title: 'Activation risk after closing',
      severity: 'high',
      message: 'Closed deal has incomplete fulfillment readiness data.',
      recommendedAction: 'Block handoff until activation checklist is complete.',
    },
  ]

  return {
    rules: defaultSalesAutomationRules,
    queue,
    alerts,
    metrics: {
      activeRules: defaultSalesAutomationRules.filter((rule) => rule.status === 'active').length,
      pendingActions: queue.length,
      urgentAlerts: alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high').length,
      automationCoverage: 82,
    },
  }
}
