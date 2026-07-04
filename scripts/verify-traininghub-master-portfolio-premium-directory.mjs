import fs from 'node:fs'

const file = 'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

const content = fs.readFileSync(file, 'utf8')

const checks = [
  {
    name: 'Portfolio view mode state exists',
    pass: content.includes("portfolioView") && content.includes("useState<'cards' | 'list'>"),
  },
  {
    name: 'PartnerDirectory rendered',
    pass: content.includes('<PartnerDirectory') && content.includes('onOpenPartner={setSelectedPartner}'),
  },
  {
    name: 'List view exists',
    pass: content.includes("viewMode === 'list'") && content.includes('DirectoryPartnerRow'),
  },
  {
    name: 'Cards view exists',
    pass: content.includes('DirectoryPartnerCard') && content.includes('directoryCardsGrid'),
  },
  {
    name: 'Gateway section exists',
    pass: content.includes('gatewayGrid') && content.includes('GatewayTile'),
  },
  {
    name: 'All cards/rows open dossier',
    pass: content.includes('onOpenPartner(partner)') && content.includes('onClick={onOpen}'),
  },
  {
    name: 'Premium directory styles exist',
    pass: content.includes('directoryHero') && content.includes('directoryPremiumCard') && content.includes('directoryRow'),
  },
]

console.table(checks)

if (checks.some((check) => !check.pass)) {
  console.error('TrainingHub master portfolio premium directory verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub master portfolio premium directory verification PASSED.')
