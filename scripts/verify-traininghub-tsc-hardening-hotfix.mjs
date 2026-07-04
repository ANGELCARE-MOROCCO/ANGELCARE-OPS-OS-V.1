import fs from 'node:fs'

function read(file) {
  try { return fs.readFileSync(file, 'utf8') } catch { return '' }
}

const modal = read('components/traininghub/internal/ExistingPartnerSyncedModal.tsx')
const portfolio = read('components/traininghub/internal/TrainingHubPartnersPortfolioProduction.tsx')
const premium = read('components/traininghub/internal/TrainingHubCommandCenterPremiumProduction.tsx')
const final = read('components/traininghub/internal/TrainingHubCommandCenterProductionFinal.tsx')
const ac360 = read('lib/ac360/customer-command-center-model.ts')
const workflows = read('lib/traininghub/production/workflows.ts')
const r2 = read('components/traininghub/internal/TrainingHubCommandCenterExactVisualMatchR2.tsx')

const checks = [
  ['modal accepts onChanged', modal.includes('onChanged?:')],
  ['modal still accepts onUpdated', modal.includes('onUpdated?:')],
  ['portfolio has no literal string style props', !/style="[^"]*"/.test(portfolio) && !/style=\{['"][^'"]*['"]\}/.test(portfolio)],
  ['premium active access guarded', !/\b(item|entry|nav|link|module|section)\.active\b/.test(premium)],
  ['final active access guarded', !/\b(item|entry|nav|link|module|section)\.active\b/.test(final)],
  ['ac360 recommendedNext guarded', !/command\.recommendedNext\.(map|length|filter|slice)/.test(ac360)],
  ['workflows bare ok false error removed', !/return\s+\{\s*ok:\s*false,\s*error:/.test(workflows)],
  ['R2 total rendered safely', !/\{total\}/.test(r2)],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub TSC hardening hotfix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub TSC hardening hotfix verification PASSED.')
