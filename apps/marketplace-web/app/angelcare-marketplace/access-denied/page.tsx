import { PublicShell } from '@/angelcare-marketplace/shells/PublicShell'
import { ButtonLink, StatePanel } from '@/angelcare-marketplace/design-system/ui'

export const metadata = { title: 'Accès refusé' }

export default function MarketplaceAccessDeniedPage() {
  return (
    <PublicShell>
      <StatePanel
        type="denied"
        title="Accès non autorisé"
        text="Votre session est reconnue, mais votre rôle ne dispose pas de la permission nécessaire. Aucune donnée protégée n’a été chargée."
        actions={
          <>
            <ButtonLink href="/angelcare-marketplace/workspace">Retour à mon espace</ButtonLink>
            <ButtonLink href="/angelcare-marketplace" variant="secondary">Entrée publique</ButtonLink>
          </>
        }
      />
    </PublicShell>
  )
}
