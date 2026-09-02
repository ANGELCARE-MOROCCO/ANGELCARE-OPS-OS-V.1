import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function PayrollPage() {
  const page = getSanilaPublicPage('paie')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <WorkflowSection page={page} title="De la période au paiement, contrôler chaque étape du traitement." />
      <CapabilitiesSection page={page} />
      <ProofSection page={page} />
      <CrossDomainBridge from="paie" to="rapports" title="La paie doit rester gouvernable après le paiement." body="Historique personnel, conformité et audit prolongent le traitement au-delà de la simple exécution mensuelle." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
