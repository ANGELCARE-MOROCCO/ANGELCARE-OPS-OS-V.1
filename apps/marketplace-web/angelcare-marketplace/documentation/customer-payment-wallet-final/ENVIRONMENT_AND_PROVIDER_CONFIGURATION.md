# Environment and Provider Configuration

## Customer authentication

The customer identity implementation uses the existing Supabase project and does not introduce a second authentication authority.

Configure the deployed Marketplace URLs in Supabase Auth redirect settings for the relevant production and preview domains. Email/password, recovery and magic-link flows use the existing Supabase email configuration. Telephone OTP remains unavailable until an SMS provider is configured in Supabase Auth.

## Payment orchestration

The payment domain is provider-neutral. Bank transfer, invoice and pay-at-location methods can remain governed pending obligations. Card capture remains inactive until an appropriate payment provider is connected through the adapter boundary.

The generic external-provider adapter reads these server-only variables when deliberately activated:

```text
ANGELCARE_PAYMENT_PROVIDER
ANGELCARE_PAYMENT_PROVIDER_SECRET
ANGELCARE_PAYMENT_WEBHOOK_SECRET
```

Do not expose provider secrets to browser code. Do not activate card payment before sandbox intent, callback, replay, failure, refund and reconciliation tests pass.

## AC Privilege Wallet

AC Wallet opens with a zero balance. Credits become available only through verified ledger events. The migration seeds no customer balance and no active discount. Two policy templates remain in draft until an administrator configures, simulates and activates them.

## Production evidence required

1. Register and verify a genuine test customer.
2. Confirm family and organization isolation.
3. Activate a Wallet with a zero initial balance.
4. Configure one draft Wallet policy and compare normal versus Wallet pricing.
5. Connect one payment provider in sandbox.
6. Verify signed webhook capture and duplicate-event idempotency.
7. Verify failed payment releases a Wallet reservation.
8. Verify partial refund allocation to the original sources.
9. Reconcile Wallet liability and external provider settlement.
10. Run the included read-only runtime smoke script.
