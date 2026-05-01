
import Link from 'next/link'
import { ONBOARDING_STEPS } from '../_lib/hrOnboardingEngine'

export default function Page() {
  return (
    <div style={{padding:20}}>
      <h1>HR-OS Onboarding</h1>
      {ONBOARDING_STEPS.map(step => (
        <div key={step.id} style={{margin:10, padding:10, border:'1px solid #ddd'}}>
          <strong>Step {step.id}: {step.title}</strong>
          <br/>
          <Link href={step.route}>Go to step</Link>
        </div>
      ))}
    </div>
  )
}
