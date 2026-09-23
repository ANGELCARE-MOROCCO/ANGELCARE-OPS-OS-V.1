import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function InventoryPage() {
  const page = getSanilaPublicPage('inventaire')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <WorkflowSection page={page} title="De la référence au mouvement, conserver la responsabilité." />
      <CapabilitiesSection page={page} />
      <ProofSection page={page} />
      <CrossDomainBridge from="inventaire" to="rapports" title="L’inventaire prend de la valeur lorsque les mouvements peuvent être relus et restitués." body="Risque, historique et audit donnent à l’actif une continuité opérationnelle au-delà du simple stock." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
