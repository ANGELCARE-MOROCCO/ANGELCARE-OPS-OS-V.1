const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'

for (const path of ['/api/attendance/status']) {
  try {
    const res = await fetch(`${base}${path}`, { headers: { accept: 'application/json' } })
    const txt = await res.text()
    console.log(path, res.status, txt.slice(0, 800))
  } catch (error) {
    console.log(path, 'fetch failed', error?.message || error)
  }
}

console.log('Punch endpoint is protected. Test real punch from the overhead panel while logged in.')
