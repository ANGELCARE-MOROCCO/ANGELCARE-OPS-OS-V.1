import fs from 'node:fs'

const route = 'app/api/traininghub/internal/partners/[organizationId]/route.ts'
const hardRoute = 'app/api/traininghub/internal/partners/[organizationId]/hard-delete/route.ts'
const commercial = 'components/traininghub/commercial/TrainingHubCommercialCommandCenter.tsx'
const subpage = 'components/traininghub/TrainingHubPartnerSubPage.tsx'

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const routeText = read(route)
const hardRouteText = read(hardRoute)
const commercialText = read(commercial)
const subpageText = read(subpage)

const checks = [
  ['base partner route has no ainingHubContext typo', !routeText.includes('ainingHubContext')],
  ['hard-delete route has no ainingHubContext typo', !hardRouteText.includes('ainingHubContext')],
  ['commercial preview is allowed in action type', !commercialText.includes('Record<"delete" | "audit" | "visibility" | "offer" | "session" | "credits" | "print" | "invoice" | "dossier" | "convert" | "opportunity" | "followup" | "subscription", string>')],
  ['partner subpage tone includes amber or reusable tone type', subpageText.includes('amber') && (subpageText.includes('TrainingHubPartnerTone') || subpageText.includes("'green' | 'amber'"))],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub build restore follow-up verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub build restore follow-up verification PASSED.')
