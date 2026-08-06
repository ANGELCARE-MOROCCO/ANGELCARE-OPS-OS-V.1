# Operator Guide

## Customer activation

1. Open `/angelcare-marketplace/fr/auth/register`.
2. Register a real test customer and verify the email.
3. Open `/angelcare-marketplace/fr/account`.
4. Confirm guest basket/journeys are attached only to that customer.
5. Open `/angelcare-marketplace/fr/account/wallet`; the new wallet must begin at **0 AC**.

## Wallet operations

- Executive command: `/angelcare-marketplace/admin/wallet`
- Policy Studio: `/angelcare-marketplace/admin/wallet/policies`
- Customer dossiers: `/angelcare-marketplace/admin/wallet/customers`
- Risk: `/angelcare-marketplace/admin/wallet/risk`
- Reconciliation: `/angelcare-marketplace/admin/wallet/reconciliation`

Do not use manual adjustment to imitate a top-up. A top-up must be credited only after an external payment event is verified. Manual credits require a reason and are recorded as separate ledger types.

## Policy lifecycle

```text
Draft
→ configure targeting and benefit
→ simulate against a real customer/basket
→ inspect accepted and rejected policies
→ activate
→ verify customer-facing comparison
→ suspend/resume or version when required
```

Draft templates contain no active discount. Ordinary commercial policy activation does not require a mandatory approval queue, but server permissions and audit remain mandatory.

## Enterprise order operations

Open `/angelcare-marketplace/admin/orders`. Use the unified portfolio to inspect customer, payment, Wallet, fulfillment, risk and next action. Journey status changes create canonical audit evidence. Financial truth is corrected with refunds or compensating entries, never direct editing.
