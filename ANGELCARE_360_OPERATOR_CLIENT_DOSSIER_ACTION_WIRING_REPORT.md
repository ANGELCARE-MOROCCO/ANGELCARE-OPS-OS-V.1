# AngelCare 360 Operator Client Dossier Action Wiring Report

## Root Cause

The operator client dossier had the main mutation surface wired through a shared drawer, but the page itself still felt static because row-level workflows on invoices and payments were not interactive. The last mile actions for invoice email, receipt email, and gate creation were missing from the dossier view.

## Actions Audited

- Modifier client
- Archiver client
- Créer / lier tenant
- Statut tenant
- Créer abonnement
- Compte facturation
- Émettre facture
- Enregistrer paiement
- Confirmer paiement
- Rejeter paiement
- Tâche onboarding
- Ouvrir ticket support
- Créer contrat
- Statut contrat
- Créer renouvellement
- Créer gate paiement
- Gate attente manuelle
- Gate traité manuellement
- Lever gate
- Annuler gate
- Ajouter note
- A4 / imprimer sur les factures récentes
- Reçu A4 sur les paiements récents
- Envoyer facture
- Envoyer reçu

## Actions Wired

- `Modifier client` opens the existing operator drawer and saves through the real clients API.
- `Archiver client` opens a confirmation flow and calls the real archive mutation.
- `Créer / lier tenant` and `Statut tenant` remain real drawer actions backed by the tenants API.
- `Créer abonnement`, `Compte facturation`, `Émettre facture`, `Enregistrer paiement`, `Confirmer paiement`, `Rejeter paiement`, `Tâche onboarding`, `Ouvrir ticket support`, `Créer contrat`, `Statut contrat`, `Créer renouvellement`, `Créer gate paiement`, `Gate attente manuelle`, `Gate traité manuellement`, `Lever gate`, `Annuler gate`, and `Ajouter note` remain real operator mutations in the dossier drawer.
- Invoice rows now expose `A4 / imprimer`, `Envoyer facture`, and `Créer gate paiement`.
- Payment rows now expose `Reçu A4` and `Envoyer reçu`.

## Actions Linked

- `Voir toutes les factures`
- `Voir tous les paiements`
- `Voir les tickets support`
- `Voir l’onboarding`
- `Voir les renouvellements`
- `Voir l’audit complet`
- `Voir les gates paiement`
- `État de compte A4`
- Invoice print links on recent invoice rows
- Payment receipt print links on recent payment rows

## Disabled / Locked States

- Invoice email and receipt email are disabled when Email-OS is unavailable or no recipient can be resolved.
- Create-gate-from-invoice is disabled when the invoice already has an active gate or when the balance due is zero.
- The dossier keeps the existing locked panel for infrastructure that is not available yet.

## API / Server Operations Used

- `/api/angelcare360/operator/clients`
- `/api/angelcare360/operator/tenants`
- `/api/angelcare360/operator/subscriptions`
- `/api/angelcare360/operator/billing`
- `/api/angelcare360/operator/payment-gates`
- `/api/angelcare360/operator/onboarding`
- `/api/angelcare360/operator/support`
- `/api/angelcare360/operator/contracts`
- `/api/angelcare360/operator/renewals`
- `/api/angelcare360/operator/service`
- Email-OS bridge helpers for invoice and receipt sends

## Performance Preserved

- The client dossier remains summary-first.
- Recent invoices, payments, gates, support tickets, onboarding tasks, contracts, renewals, service events, and audit logs stay bounded.
- Row actions are lazy and only open when clicked.
- No unbounded dossier loading was reintroduced.

## Files Changed

- `/Users/user/Desktop/angelcare-opsos-app/app/(protected)/angelcare-360-operator/clients/[id]/page.tsx`
- `/Users/user/Desktop/angelcare-opsos-app/components/angelcare360/operator/Angelcare360OperatorInvoiceRowActions.tsx`
- `/Users/user/Desktop/angelcare-opsos-app/components/angelcare360/operator/Angelcare360OperatorPaymentRowActions.tsx`
- `/Users/user/Desktop/angelcare-opsos-app/app/(protected)/angelcare-360-command-center/finance/factures/[id]/page.tsx`
- `/Users/user/Desktop/angelcare-opsos-app/app/(protected)/angelcare-360-command-center/finance/frais/[id]/page.tsx`
- `/Users/user/Desktop/angelcare-opsos-app/app/(protected)/angelcare-360-command-center/finance/paiements/[id]/page.tsx`

## TypeScript Result

- Passed with `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`

## Build / Staging

- Build not run.
- Staging not performed.
- Commit not created.

## Smoke Test Checklist

1. Open `/angelcare-360-operator/clients/00000000-0000-0000-0000-000000100001`.
2. Open `Modifier client` and save a harmless field change.
3. Open `Archiver client` and verify the confirm flow appears.
4. On a recent invoice row, click `A4 / imprimer`.
5. On a recent invoice row, click `Envoyer facture`.
6. On a recent invoice row, click `Créer gate paiement`.
7. On a recent payment row, click `Reçu A4`.
8. On a recent payment row, click `Envoyer reçu`.
9. Confirm quick links still navigate to invoices, payments, support, onboarding, renewals, audit, and gates.
10. Verify the page still loads only bounded recent lists and does not freeze.
