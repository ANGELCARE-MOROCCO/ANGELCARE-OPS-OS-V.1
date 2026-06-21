export type MarketingSyncSource = 'market-os' | 'revenue' | 'content' | 'connect' | 'tasks'
export async function getMarketingHomeSyncSnapshot(){
  return { updatedAt: new Date().toISOString(), sources: [
    { source:'market-os' as MarketingSyncSource, status:'synced', records:27 },
    { source:'revenue' as MarketingSyncSource, status:'synced', records:318 },
    { source:'content' as MarketingSyncSource, status:'watch', records:24 },
    { source:'connect' as MarketingSyncSource, status:'ready', records:8 },
    { source:'tasks' as MarketingSyncSource, status:'synced', records:63 },
  ]}
}
