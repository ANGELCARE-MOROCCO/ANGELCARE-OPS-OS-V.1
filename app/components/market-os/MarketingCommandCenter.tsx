'use client'
import dynamic from 'next/dynamic'
const MarketingExecutiveUI = dynamic(() => import('./MarketingExecutiveUI'), {
  ssr: false,
  loading: () => <div style={{minHeight:'100vh',background:'#050b14',color:'#fff',padding:40,fontFamily:'Inter,Arial'}}><h1>AI-Powered Marketing Executive Command Center</h1><p>Initializing Market-OS synchronization...</p></div>,
})
export default function MarketingCommandCenter(){ return <MarketingExecutiveUI/> }
