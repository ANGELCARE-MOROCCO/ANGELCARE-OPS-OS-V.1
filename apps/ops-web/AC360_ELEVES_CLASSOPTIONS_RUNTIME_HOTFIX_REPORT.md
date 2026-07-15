# AngelCare 360 — Élèves classOptions Runtime Hotfix

## Error fixed

Runtime error:

```txt
ReferenceError: classOptions is not defined
```

Location:

```txt
components/angelcare360/people/Angelcare360StudentsOverview.tsx
```

## Root cause

The final “ultimate lock” refactor kept the class filter dropdown:

```tsx
{classOptions.map(...)}
```

but accidentally removed:

```tsx
const classOptions = uniqueClassOptions(rows)
```

## Fix

Restores the missing constant before render:

```tsx
const classOptions = uniqueClassOptions(rows)
```

## Scope

- Only `components/angelcare360/people/Angelcare360StudentsOverview.tsx`
- No visual redesign
- No backend change
- No seed
- No migration
- No sidebar/shell change
- No route change

## Verify

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
rm -rf .next
npm run dev
```
