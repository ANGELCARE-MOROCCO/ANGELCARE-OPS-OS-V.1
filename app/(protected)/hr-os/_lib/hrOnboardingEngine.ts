
export const ONBOARDING_STEPS = [
  { id: 1, title: 'Understand HR-OS', route: '/hr-os' },
  { id: 2, title: 'Realtime Alerts', route: '/hr-os/realtime' },
  { id: 3, title: 'Execute Actions', route: '/hr-os/recruitment' },
  { id: 4, title: 'Enterprise Commands', route: '/hr-os/enterprise' },
  { id: 5, title: 'Complete Simulation', route: '/hr-os/war-room' },
]

export function getNextStep(currentStep: number) {
  return ONBOARDING_STEPS.find(s => s.id === currentStep + 1)
}
