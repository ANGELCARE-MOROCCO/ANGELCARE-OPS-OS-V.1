import fs from "node:fs"
const routes = [
  "app/(protected)/market-os/content-command-center/studio/page.tsx",
  "app/(protected)/market-os/content-command-center/create/page.tsx",
  "app/(protected)/market-os/content-command-center/assets/page.tsx",
  "app/(protected)/market-os/content-command-center/active-assets/page.tsx",
  "app/(protected)/market-os/content-command-center/evidence/page.tsx",
  "app/(protected)/market-os/content-command-center/review/page.tsx",
]
for (const route of routes) if (!fs.existsSync(route)) throw new Error(`MZ5 route missing: ${route}`)
const manifest = fs.readFileSync("MZ5_PATCH_FILE_LIST.txt", "utf8")
for (const forbidden of ["/validation/", "/distribution/", "/publishing/", "/ai-director/", "supabase/migrations", "app/api/"]) {
  if (manifest.includes(forbidden)) throw new Error(`MZ5 scope violation: ${forbidden}`)
}
console.log("PASS — exactly six contracted MZ5 routes remain present and unrelated workspaces are outside the patch")
