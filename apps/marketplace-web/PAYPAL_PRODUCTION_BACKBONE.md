# ANGELCARE Marketplace — PayPal Production Backbone

## Canonical boundary

- Marketplace branch: `marketplace-production`
- Customer-facing origin: `https://my.angelcarehub.com`
- Marketplace base path: `/angelcare-marketplace`
- PayPal webhook listener: `https://my.angelcarehub.com/api/angelcare-marketplace/payments/webhooks/paypal`
- Approved PayPal currency: `EUR`
- Canonical AngelCare commercial/accounting currency remains `Dh`.

## Implemented flow

1. Checkout creates a durable AngelCare payment intent in Dh.
2. Any AC Wallet contribution is reserved first and is not spent yet.
3. The external Dh contribution is converted to EUR using the controlled `PAYPAL_DH_PER_PAYPAL_UNIT` value.
4. The exact EUR amount, currency, conversion rate, PayPal order ID and canonical Dh amount are locked into payment-intent evidence.
5. A PayPal Orders v2 order is created server-side and the buyer is redirected to the PayPal approval URL.
6. The return endpoint captures the approved order server-side; the webhook path can also capture `CHECKOUT.ORDER.APPROVED` safely.
7. Capture amount/currency are verified against the locked provider evidence before the AngelCare payment becomes `captured`.
8. Any AC Wallet reservation is committed only after successful external capture.
9. Checkout state is resumed after the PayPal redirect and the conversion cannot be confirmed unless the matching payment intent is captured.
10. Webhooks are verified using PayPal's signature-verification REST API and replay-protected in `angelcare_marketplace_payment_provider_events`.
11. Refunds use the original PayPal capture ID and the original locked Dh/EUR conversion rate. Wallet restoration uses idempotent ledger entries.
12. Reversals and unresolved refund failures are fail-closed into reconciliation queues instead of being represented as successful money movement.

## Production variables

See `PAYPAL_PRODUCTION_ENV.example`. Secrets must remain server-side. `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is not required by this server-redirect architecture.

## Webhook registration

From `apps/marketplace-web` with the live PayPal credentials available in environment variables:

```bash
node scripts/angelcare-marketplace/paypal-register-webhook.mjs
```

The command creates or updates the subscription for the canonical `my.angelcarehub.com` listener and prints the resulting `PAYPAL_WEBHOOK_ID` without printing the client secret.

After adding that ID to Vercel Production, run:

```bash
node scripts/angelcare-marketplace/paypal-production-preflight.mjs
```

The preflight performs OAuth and webhook-subscription checks only. It does not create an order and does not charge money.

## Required webhook events

- `CHECKOUT.ORDER.APPROVED`
- `CHECKOUT.PAYMENT-APPROVAL.REVERSED`
- `PAYMENT.CAPTURE.PENDING`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DECLINED`
- `PAYMENT.CAPTURE.REFUNDED`
- `PAYMENT.CAPTURE.REVERSED`
- `PAYMENT.REFUND.PENDING`
- `PAYMENT.REFUND.FAILED`

## Deliberate fail-closed boundaries

- PayPal is unavailable until client ID, client secret, webhook ID and positive Dh/EUR rate are configured.
- Marketplace order confirmation is blocked until the matching conversion-session payment is captured.
- Payment amount mismatch or currency mismatch blocks capture finalization.
- Reversed captures move to reconciliation instead of silently changing commercial truth.
- PayPal refund completion is reconciled against PayPal before final refund totals are promoted.
- No PayPal secret is exposed to the browser.
