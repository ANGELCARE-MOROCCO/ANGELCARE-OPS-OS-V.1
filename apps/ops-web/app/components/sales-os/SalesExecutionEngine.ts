export type SalesSignalInput = {
  urgency: number
  budget: number
  authority: number
  trust: number
  paymentReadiness: number
  objectionCount: number
}

export function computeClosingScore(input: SalesSignalInput) {
  const base = input.urgency * 0.22 + input.budget * 0.18 + input.authority * 0.18 + input.trust * 0.16 + input.paymentReadiness * 0.24
  const penalty = Math.min(18, input.objectionCount * 4)
  return Math.max(0, Math.min(100, Math.round(base - penalty)))
}

export function recommendNextAction(score: number, input: SalesSignalInput) {
  if (input.paymentReadiness >= 75 && score >= 70) return 'Request payment proof and prepare fulfillment handoff'
  if (input.trust < 55) return 'Use trust reassurance script before price discussion'
  if (input.authority < 50) return 'Identify decision-maker and schedule closing call'
  if (input.budget < 55) return 'Build package comparison and protect margin with deal desk rule'
  if (input.objectionCount >= 3) return 'Open objection library and resolve blockers before sending quote'
  return 'Send WhatsApp recap and lock next follow-up deadline'
}

export function buildSalesScript(segment: string, objection: string, urgency: string) {
  return [
    `Bonjour, je vous contacte pour clarifier rapidement votre besoin ${segment} et éviter toute perte de temps.`,
    `D'après ce que vous m'avez expliqué, le point prioritaire est: ${urgency}.`,
    `Concernant votre blocage (${objection}), notre rôle est de sécuriser le choix, le suivi et la continuité du service.`,
    "Je vous propose donc une option claire: valider le besoin, confirmer le prix, fixer le délai de paiement, puis transmettre immédiatement à l'équipe fulfillment.",
    'Est-ce que je peux vous envoyer le récapitulatif final maintenant avec la prochaine action exacte ?',
  ].join('\n\n')
}

export function buildFollowUpSequence(clientState: string) {
  return [
    { step: 'T+0', channel: 'Call', action: `Clarify ${clientState}, confirm decision-maker and restate the recommended offer.` },
    { step: 'T+15min', channel: 'WhatsApp', action: 'Send recap, package, price, payment method and decision deadline.' },
    { step: 'T+2h', channel: 'WhatsApp', action: 'Ask what is blocking the decision and offer direct call.' },
    { step: 'T+24h', channel: 'Call', action: 'Escalate urgency, confirm if deal is still active or should be paused.' },
  ]
}
