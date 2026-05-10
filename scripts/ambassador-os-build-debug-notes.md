# Ambassador OS Build Debug Notes

Run:

```bash
npm run build
```

If TypeScript fails:

1. Check missing named/default imports.
2. Check duplicate exported component names.
3. Check route page imports.
4. Check path aliases.
5. Check whether copied files overwrote old files.
6. Check whether app route folder names match actual URLs.

Useful scans:

```bash
node scripts/ambassador-os-route-smoke-check.mjs
node scripts/ambassador-os-duplicate-risk-scan.mjs
```
