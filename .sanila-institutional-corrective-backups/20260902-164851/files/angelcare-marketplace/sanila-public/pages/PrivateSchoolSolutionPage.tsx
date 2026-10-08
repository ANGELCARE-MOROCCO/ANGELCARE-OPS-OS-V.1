import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function PrivateSchoolSolutionPage() {
  const page = getSanilaPublicPage('solutions/ecoles-privees')!
  return (
    <>
      <RecognitionBand page={page} />
      <ContextSection page={page} />
      <CapabilitiesSection page={page} />
      <WorkflowSection page={page} title="Relier administration, pédagogie, finance et familles sans créer de silos." />
      <DomainExplorer />
      <ProofSection page={page} />
      <RoleExperienceSection />
      <FinalCTA page={page} />
    </>
  )
}
