# Finance & Reconciliation Guide

## Wallet liability

Purchased AC credits represent funded closed-loop customer value until spent or lawfully refunded. Promotional, goodwill, employer and gift credits remain separately identifiable. Finance must reconcile:

- external top-up settlement;
- purchased-credit liability;
- promotional exposure;
- reservations;
- Wallet spend applied to canonical orders;
- external payment contribution;
- refunds by original source;
- chargebacks and freezes;
- expired promotional value;
- provider settlement differences.

## Non-negotiable rules

- No top-up credit before verified provider capture.
- No ledger deletion or direct update.
- No browser-calculated balance or discount is trusted.
- No external refund without a provider reference.
- No double refund across Wallet and external payment.
- Every discrepancy creates a reconciliation item.

## Card activation

Before enabling `card`, configure the provider-specific adapter, tokenized/hosted card UI, webhook secret, sandbox credentials, refund mapping and settlement reconciliation. Raw card number and CVV storage is prohibited.
