import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="LOCALE READINESS"
      title="Préparation linguistique par territoire"
      description="La readiness est calculée depuis les preuves du scanner et les publications courantes."
      items={[
        'Couverture par route',
        'Bloquants sensibles',
        'SEO incomplet',
        'RTL à corriger',
      ]}
    />
  )
}
