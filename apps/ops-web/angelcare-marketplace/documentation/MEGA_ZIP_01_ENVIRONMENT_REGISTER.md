# Mega ZIP 01 — Environment Register

The implementation reuses the existing OPS Web Supabase environment loader and does not introduce new credentials.

## Existing required server values

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` where the host requires a user-scoped client
- existing service-role environment value resolved by `lib/supabase/env.ts`

## Optional Marketplace value

- `ANGELCARE_MARKETPLACE_RELEASE_VERSION` — defaults safely to `mega-zip-01`.

No credential value is included in the delivery ZIP. `.env`, `.env.local`, keys, tokens and connection strings are excluded from the package.
