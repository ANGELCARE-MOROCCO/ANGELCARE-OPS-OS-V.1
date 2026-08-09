# ANGELCARE Marketplace — Final Stabilization Operator Commands

Run from `apps/ops-web`.

## Source-only acceptance

```bash
node scripts/angelcare-marketplace/final-stabilization/run-final-stabilization.mjs
```

## Marketplace TypeScript authority

```bash
MARKETPLACE_TYPESCRIPT_HEAP_MB=3072 \
MARKETPLACE_TYPESCRIPT_MAX_MINUTES=20 \
node scripts/angelcare-marketplace/final-stabilization/run-typescript-authority.mjs --targeted
```

## Runtime smoke

```bash
MARKETPLACE_BASE_URL=http://localhost:3000 \
node scripts/angelcare-marketplace/final-stabilization/runtime-smoke.mjs --full --strict
```

For authenticated routes, provide the controlled test-session cookie:

```bash
MARKETPLACE_BASE_URL=http://localhost:3000 \
MARKETPLACE_COOKIE='cookie-name=value' \
node scripts/angelcare-marketplace/final-stabilization/runtime-smoke.mjs --full --strict
```

## Visual evidence

```bash
MARKETPLACE_BASE_URL=http://localhost:3000 \
MARKETPLACE_STORAGE_STATE=/absolute/path/to/marketplace-storage-state.json \
node scripts/angelcare-marketplace/final-stabilization/capture-visual-evidence.mjs --full
```

## Accessibility and performance evidence

```bash
node scripts/angelcare-marketplace/final-stabilization/evaluate-accessibility.mjs
node scripts/angelcare-marketplace/final-stabilization/evaluate-performance.mjs
```

## Selected Supabase read-only preflight

Using `psql`:

```bash
MARKETPLACE_DATABASE_URL='postgresql://...' \
node scripts/angelcare-marketplace/final-stabilization/run-database-preflight.mjs
```

Or copy `database-preflight.sql` into Supabase SQL Editor. It runs a read-only transaction.

## Final decision

```bash
node scripts/angelcare-marketplace/final-stabilization/evaluate-launch.mjs
```

None of these commands performs a build, Git operation, deployment or production launch.
