import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function SolutionsPage() {
  const page = getSanilaPublicPage('solutions')!
  return (
    <>
      <RecognitionBand page={page} />
      <SolutionCards />
      <WorkflowSection page={page} title="Commencer par votre modèle d’établissement." />
      <ProofSection page={page} />
      <FinalCTA page={page} />
    </>
  )
}
