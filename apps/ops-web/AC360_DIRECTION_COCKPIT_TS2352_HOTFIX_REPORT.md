# AC360 Direction Cockpit — TS2352 Hotfix

## Error fixed

`lib/angelcare360/server/direction.ts`

TypeScript raised:

```txt
TS2352: Conversion of type 'GenericStringError[]' to type 'Row[]' may be a mistake...
```

## Root cause

Supabase can type a dynamic or relation-heavy select response as `GenericStringError[]` at compile time. Runtime errors are still handled through the Supabase `error` object, but TypeScript requires this generic data cast to pass through `unknown` first.

## Change

Inside `selectRows(...)`, the return was changed from:

```ts
return (data || []) as Row[]
```

to:

```ts
return (Array.isArray(data) ? data : []) as unknown as Row[]
```

## Scope

- Only `lib/angelcare360/server/direction.ts`
- No UI change
- No backend logic change
- No seed
- No migration
- No sidebar/shell change
- No route outside Direction touched

## Verify

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
```
