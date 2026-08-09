import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="SENSITIVE REVIEW QUEUE"
      title="Aucun contenu sensible sans preuve"
      description="Les textes juridiques, trust, child safety, pricing et medical boundary exigent une revue explicite."
      items={[
        'Revue juridique',
        'Revue confiance',
        'Revue sécurité enfant',
        'Décision et audit',
      ]}
    />
  )
}
