import Link from 'next/link'
export function ServiceOSActionBar() {
  const links = [
    ['/services/blueprints/new','+ Blueprint'], ['/services/rules','Rules'], ['/services/pricing-engine','Pricing'], ['/services/live-ops','LiveOps'], ['/services/enterprise','Enterprise']
  ]
  return <div style={{display:'flex',gap:10,flexWrap:'wrap',margin:'0 0 18px'}}>{links.map(([href,label]) => <Link key={href} href={href} style={{border:'1px solid #dbe3ef',borderRadius:999,padding:'10px 14px',background:'#fff',color:'#0f172a',fontWeight:800,textDecoration:'none'}}>{label}</Link>)}</div>
}
