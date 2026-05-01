
import { computeWorkforceGap } from '../_lib/hrStrategyEngine'

export default function Page() {
  const gap = computeWorkforceGap(12, 20)

  return (
    <div style={{padding:20}}>
      <h1>HR Strategy War Room</h1>
      <p>Workforce Gap (example): {gap}</p>
      <div>More strategic panels coming...</div>
    </div>
  )
}
