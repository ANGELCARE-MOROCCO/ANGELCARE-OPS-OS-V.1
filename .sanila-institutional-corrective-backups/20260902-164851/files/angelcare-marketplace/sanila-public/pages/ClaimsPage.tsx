import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function ClaimsPage() {
  const page = getSanilaPublicPage('reclamations')!
  return (
    <>
      <RecognitionBand page={page} />
      <ContextSection page={page} />
      <DomainSignature page={page} />
      <WorkflowSection page={page} title="De la préoccupation à la clôture, donner une responsabilité claire." />
      <CapabilitiesSection page={page} />
      <ProofSection page={page} />
      <CrossDomainBridge from="reclamations" to="direction" title="La qualité de résolution doit pouvoir remonter à la direction sans exposer tout le bruit opérationnel." body="Priorité, assignation, action et clôture permettent une lecture plus responsable de la relation famille." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
