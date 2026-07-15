
const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const endpoints = [
  "/api/market-os/content-command-center/templates",
  "/api/market-os/content-command-center/assets",
  "/api/market-os/content-command-center/documents",
  "/api/market-os/content-command-center/tasks",
  "/api/market-os/content-command-center/comments",
  "/api/market-os/content-command-center/categories",
  "/api/market-os/content-command-center/activity",
  "/api/market-os/content-command-center/workspace",
]

for (const endpoint of endpoints) {
  const res = await fetch(`${base}${endpoint}`)
  const text = await res.text()
  console.log(endpoint, res.status, text.slice(0, 120))
  if (!res.ok) process.exitCode = 1
}
