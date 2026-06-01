# Options Runtime Hard Repair

Run from your app root:

```bash
cd ~/Desktop/angelcare-opsos-app
node repair-options-runtime-hard.cjs
rm -rf .next
npm run dev
```

Then verify:

```bash
sed -n '1,8p' app/api/saas-factory/options/summary/route.ts
ls -la lib/saas-factory/options-runtime.ts
npm run build
npx tsc --noEmit --pretty false
```
