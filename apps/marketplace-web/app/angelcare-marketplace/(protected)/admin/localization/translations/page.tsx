import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="TRANSLATION WORKSPACE"
      title="Fulfillment EN/FR/AR gouverné"
      description="Comparer la source française, les versions, les variables, le glossaire et les décisions de revue."
      items={[
        'File de traduction',
        'Diff de source',
        'Affectation traducteur',
        'Publication versionnée',
      ]}
    />
  )
}
