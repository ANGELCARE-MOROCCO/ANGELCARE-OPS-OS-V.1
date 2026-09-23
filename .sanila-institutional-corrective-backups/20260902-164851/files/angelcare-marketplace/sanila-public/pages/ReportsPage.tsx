import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function ReportsPage() {
  const page = getSanilaPublicPage('rapports')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <ProofSection page={page} />
      <WorkflowSection page={page} title="De l’opération à la restitution, garder une origine lisible." />
      <CapabilitiesSection page={page} />
      <CrossDomainBridge from="rapports" to="direction" title="Le rapport est utile lorsqu’il revient à la décision." body="SANILA ne présente pas l’export comme une fin en soi : il sert la lecture, le contrôle et la gouvernance." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
