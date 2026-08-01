#!/usr/bin/env node
const base = process.env.ANGELCARE_RUNTIME_BASE_URL || 'http://localhost:3000'
const views = ['command','markets','pipeline','portfolio','contacts','offers','contracts','renewals','health','performance']
let failures=0
for (const view of views) {
  const url = `${base}/angelcare-360-operator/growth?view=${view}`
  try {
    const response = await fetch(url, { redirect: 'manual', headers: { accept: 'text/html' } })
    const text = await response.text()
    const bad = response.status >= 500 || /Functions cannot be passed directly|Hydration failed|Unhandled Runtime Error|ReferenceError:|TypeError:/i.test(text)
    if (bad) { failures++; console.error(`FAIL ${view} -> ${response.status}`) }
    else console.log(`PASS ${view} -> ${response.status}`)
  } catch (error) { failures++; console.error(`FAIL ${view}: ${error instanceof Error?error.message:String(error)}`) }
}
if(failures)process.exit(1)
console.log('PASS runtime crawl for all ten commercial scenes.')
