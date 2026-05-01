
import { generateReference } from '../_lib/hrGovernance'

export default function Page() {
  const ref = generateReference('hr','report')
  return (
    <div style={{padding:20}}>
      <h1>HR Advanced Reports</h1>
      <p>Reference: {ref}</p>
      <button>Export PDF</button>
    </div>
  )
}
