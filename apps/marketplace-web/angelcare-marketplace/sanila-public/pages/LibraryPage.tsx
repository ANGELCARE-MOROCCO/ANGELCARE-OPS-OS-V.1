import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function LibraryPage() {
  const page = getSanilaPublicPage('bibliotheque')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <CapabilitiesSection page={page} />
      <WorkflowSection page={page} title="Du catalogue au retour, suivre la circulation documentaire." />
      <ProofSection page={page} />
      <CrossDomainBridge from="bibliotheque" to="inventaire" title="Une ressource qui circule n’est pas gérée comme un actif immobile." body="Le site public distingue volontairement la logique bibliothèque de la logique inventaire pour respecter le travail réel." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
