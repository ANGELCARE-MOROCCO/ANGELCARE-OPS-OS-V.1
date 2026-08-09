import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="IMPORT CONTROL"
      title="Validation et application contrôlée"
      description="Dry run, conflits, validation des placeholders, approbation, application et rollback."
      items={[
        'Fichiers reçus',
        'Erreurs par ligne',
        'Approbations',
        'Rollbacks',
      ]}
    />
  )
}
