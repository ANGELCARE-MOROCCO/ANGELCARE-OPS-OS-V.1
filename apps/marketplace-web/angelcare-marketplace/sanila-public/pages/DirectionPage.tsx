import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function DirectionPage() {
  const page = getSanilaPublicPage('direction')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <ProofSection page={page} />
      <WorkflowSection page={page} title="Du signal à la décision, sans perdre le contexte." />
      <CapabilitiesSection page={page} />
      <CrossDomainBridge from="direction" to="rapports" title="La direction doit pouvoir descendre dans le détail puis revenir à une lecture consolidée." body="SANILA relie le pilotage aux domaines et à la restitution plutôt que de créer un cockpit décoratif déconnecté du travail réel." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
