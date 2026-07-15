# RefferQ Source Manifest

- Source path copied from: `/Users/user/Desktop/Refferq-main`
- Archived copy path inside AngelCare OPS OS: `integrations/refferq/source`
- Copy timestamp: `2026-07-09T00:00:00Z`

## Major folders copied

- `src/app`
- `src/components`
- `src/hooks`
- `src/lib`
- `src/types`
- `prisma`
- `public`
- `docs`
- `scripts`
- `wiki`
- Root metadata files such as `package.json`, `tsconfig.json`, `README.md`, `components.json`, `next.config.js`, `.env.example`, and deployment files

## Package dependencies detected

The authoritative RefferQ source declares a standalone stack centered on:

- Next.js 16
- React 19
- Prisma Client
- PostgreSQL
- bcryptjs
- jose
- resend
- framer-motion
- lucide-react
- class-variance-authority
- clsx
- tailwind-merge
- cmdk
- date-fns
- embla-carousel-react
- input-otp
- react-hook-form
- zod
- qrcode
- next-themes
- sonner
- Radix UI primitives

## Prisma models detected

The source schema contains:

- `User`
- `Affiliate`
- `Referral`
- `ReferralClick`
- `Conversion`
- `Commission`
- `Payout`
- `CommissionRule`
- `AuditLog`
- `OTP`
- `ProgramSettings`
- `PartnerGroup`
- `Transaction`
- `EmailTemplate`
- `EmailLog`
- `IntegrationSettings`
- `Webhook`
- `WebhookLog`
- `ScheduledReport`
- `SavedReport`
- `ApiKey`
- `ApiUsageLog`
- `RateLimitEntry`
- `Coupon`
- `Resource`
- `Invoice`
- `Program`
- `TeamMember`

## Route groups detected

- `src/app/admin`
- `src/app/affiliate`
- `src/app/login`
- `src/app/register`
- `src/app/r/[code]`
- `src/app/page.tsx`

## API route groups detected

- `src/app/api/admin`
- `src/app/api/affiliate`
- `src/app/api/auth`
- `src/app/api/docs`
- `src/app/api/test`
- `src/app/api/track`
- `src/app/api/webhook`

## Known deferred integration items

- Direct Prisma runtime cutover into AngelCare production data is deferred.
- Source root aliases still expect a standalone app boundary.
- Email provider wiring is preserved in source but not promoted into the live AngelCare runtime yet.
- RefferQ auth/session behavior remains archived for review and future dedicated mounting.
- This source archive is excluded from the active TypeScript build graph so the preserved source remains auditable without creating false build noise.
