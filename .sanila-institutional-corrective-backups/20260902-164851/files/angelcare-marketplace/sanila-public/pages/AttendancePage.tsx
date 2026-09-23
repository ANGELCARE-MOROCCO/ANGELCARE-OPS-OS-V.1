import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function AttendancePage() {
  const page = getSanilaPublicPage('presences')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <WorkflowSection page={page} title="Une routine rapide au début de la journée, un historique clair ensuite." />
      <CapabilitiesSection page={page} />
      <CrossDomainBridge from="presences" to="direction" title="Une présence enregistrée localement doit pouvoir devenir un signal utile au bon niveau." body="Le quotidien reste simple pour la classe tout en donnant à la direction une lecture proportionnée." />
      <ProofSection page={page} />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
