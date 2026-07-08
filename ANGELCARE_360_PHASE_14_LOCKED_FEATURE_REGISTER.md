# ANGELCARE 360 Phase 14 Locked Feature Register

## 1. PDF export
- Why locked: no production PDF engine is configured for the AngelCare 360 export flow.
- Current UI explanation: `L’export PDF sera activé dans la phase Rapports & Exports.` / `La génération PDF sera activée après configuration du moteur d’export.`
- Infrastructure needed later: real PDF generator, file storage, signed download URLs, and server-side audit.
- Pilot impact: the pilot can run without PDF output; users must accept read-only readiness states.

## 2. CSV / XLSX export
- Why locked: no safe export pipeline is configured for tabular file generation.
- Current UI explanation: `L’export CSV/XLSX nécessite une infrastructure d’export validée.`
- Infrastructure needed later: serializer, file storage, download route, and completion audit.
- Pilot impact: lists remain usable, but exported spreadsheets are not available.

## 3. Generated documents
- Why locked: no document generator / storage pipeline is trusted as a source of truth.
- Current UI explanation: `La génération documentaire sera activée dans la phase d’exports finalisée.`
- Infrastructure needed later: document renderer, storage, retention policy, and retrieval URLs.
- Pilot impact: document governance is visible, but generated files stay locked.

## 4. WhatsApp
- Why locked: no official WhatsApp provider has been validated for production use.
- Current UI explanation: `L’envoi WhatsApp sera activé après configuration d’un fournisseur officiel.`
- Infrastructure needed later: approved WhatsApp Business provider and server-side delivery audit.
- Pilot impact: communication works internally only; WhatsApp sends are blocked.

## 5. SMS
- Why locked: no SMS gateway has been configured.
- Current UI explanation: `L’envoi SMS nécessite une passerelle SMS configurée.`
- Infrastructure needed later: SMS provider credentials, delivery callbacks, and audit trail.
- Pilot impact: SMS notifications cannot be simulated.

## 6. External email
- Why locked: no validated outbound email infrastructure is exposed for these modules.
- Current UI explanation: `L’envoi email externe nécessite une infrastructure email validée.`
- Infrastructure needed later: mail provider, bounce handling, and verified sender policy.
- Pilot impact: internal notifications remain available; external email is blocked.

## 7. Push notifications
- Why locked: no push provider is configured.
- Current UI explanation: `Les notifications push seront activées dans une phase dédiée.`
- Infrastructure needed later: push provider, device token governance, and delivery history.
- Pilot impact: push is not part of the pilot.

## 8. GPS / live tracking
- Why locked: no real cartography or live telematics provider is integrated.
- Current UI explanation: `Le suivi GPS sera activé après configuration d’un fournisseur de cartographie.` / `Le suivi temps réel des véhicules n’est pas encore activé.`
- Infrastructure needed later: map provider, vehicle telemetry, and location audit.
- Pilot impact: transport remains planning-focused only.

## 9. Payment gateway / online payment
- Why locked: no real payment gateway is configured.
- Current UI explanation: `Le paiement en ligne nécessite une passerelle configurée.`
- Infrastructure needed later: payment provider, reconciliation, and secure payment logs.
- Pilot impact: finance is receivables-only; online payment is not available.

## 10. Bank transfer execution
- Why locked: payroll and payment bank execution are not wired to a real banking integration.
- Current UI explanation: `Le virement bancaire nécessite une intégration bancaire configurée.`
- Infrastructure needed later: banking integration, authorization flow, and proof of execution.
- Pilot impact: transfers remain internal readiness only.

## 11. Payroll legal compliance automation
- Why locked: CNSS / tax / legal payroll rules are not validated for automatic execution.
- Current UI explanation: `Les règles sociales, fiscales et CNSS doivent être validées avant automatisation.`
- Infrastructure needed later: validated legal rules, compliance engine, and jurisdictional review.
- Pilot impact: payroll preparation is possible, legal automation is not.

## 12. Barcode scanning
- Why locked: no scanner / barcode integration is connected.
- Current UI explanation: `La lecture code-barres nécessite une intégration dédiée.`
- Infrastructure needed later: scanner provider or device integration, scan audit, and fallback UX.
- Pilot impact: library and inventory stay manual / readiness-only.

## 13. Supplier / procurement workflow
- Why locked: out of scope for the current phase set.
- Current UI explanation: `Les achats fournisseurs ne font pas partie de cette phase.`
- Infrastructure needed later: procurement module, supplier master, purchase order flow, and approvals.
- Pilot impact: not available in the pilot.

## 14. Automatic reminders / external dispatch
- Why locked: messaging automation is not enabled for these external channels.
- Current UI explanation: `Les relances automatiques seront activées avec le module Messagerie.` / `L’envoi automatique des relances sera activé avec le module Messagerie.`
- Infrastructure needed later: notification pipeline, templates, delivery callbacks, and opt-out controls.
- Pilot impact: reminder planning is visible, actual dispatch remains blocked.
