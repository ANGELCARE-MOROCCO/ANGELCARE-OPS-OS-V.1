import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'
import { SanilaDemoForm } from '../SanilaDemoForm'
import { SanilaContactForm } from '../SanilaContactForm'
import { SanilaOnboardingForm } from '../SanilaOnboardingForm'
import styles from '../SanilaPublic.module.css'

export function ContactPage() {
  const page = getSanilaPublicPage('contact')!
  return (
    <>
      <RecognitionBand page={page} />
      <section className={`${styles.section} ${styles.formSection}`}><SanilaContactForm /></section>
      <ResourcesSection />
      <ProofSection page={page} />
    </>
  )
}
