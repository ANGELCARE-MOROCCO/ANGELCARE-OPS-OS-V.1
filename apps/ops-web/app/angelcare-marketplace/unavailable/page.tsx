import { PublicShell } from '@/angelcare-marketplace/shells/PublicShell'
import { ButtonLink, StatePanel } from '@/angelcare-marketplace/design-system/ui'

export const metadata = { title: 'Fonction indisponible' }

export default function MarketplaceUnavailablePage() {
  return (
    <PublicShell>
      <StatePanel
        type="blocked"
        title="Fonction non disponible"
        text="Cette capacité n’est pas activée pour votre périmètre ou son Mega ZIP contractuel n’est pas encore installé. Le système ne présente pas une page vide comme une fonctionnalité."
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
