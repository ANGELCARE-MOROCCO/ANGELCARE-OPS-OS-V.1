# Revenue Command H Stabilization Report

This pack creates a build-safe unification layer for Revenue Command without deleting or rewriting the current workspaces.

## What this pack adds

- `_shared/revenue-command-registry.ts`
  - one typed registry for all Revenue Command workspaces
  - groups routes by Command, Sales, Execution, Intelligence, Management, Automation
  - defines route ownership, priority, engine type and validation checklist

- `_shared/RevenueCommandUnifiedLayout.tsx`
  - global Revenue Command navigation shell
  - visible group-based workspace map
  - guardrail bar for build-safe development

- `layout.tsx`
  - keeps `requireAccess('revenue.view')`
  - wraps all Revenue Command pages in the unified shell

## Why this matters

Current Revenue Command is powerful but fragmented:

- multiple engines: `_final`, `_max`, `_v9`, `_v10`, HQ workspaces, execution controls
- repeated UI/control logic
- many routes with inconsistent depth
- API versions v9/v10/v11/v12/max living together
- some pages are production-grade while others are still template-grade

This H pass does not break those pages. It creates the foundation to migrate them safely one by one.

## Mandatory workflow after injection

```bash
rm -rf .next
npx tsc --noEmit --pretty false > ts-errors.txt 2>&1
cat ts-errors.txt
npm run build
```

If both pass:

```bash
git add .
git commit -m "revenue command h stabilization architecture layer"
```

## Next recommended phase

A. Migrate HQ to use the shared registry deeply.
B. Stabilize Prospects + Tasks as first production pair.
C. Unify API route versioning under one active version.
D. Remove or quarantine deprecated copies only after build passes.
