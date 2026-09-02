import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function PedagogyPage() {
  const page = getSanilaPublicPage('pedagogie')!
  return (
    <>
      <RecognitionBand page={page} />
      <ContextSection page={page} />
      <DomainSignature page={page} />
      <CapabilitiesSection page={page} />
      <WorkflowSection page={page} title="Du cours au bulletin, garder une continuité académique." />
      <RoleExperienceSection />
      <ProofSection page={page} />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
