
export async function hydrateWorkspace(){
  return Promise.all([
    fetch('/api/market-os/content-command-center/assets?family=Digital content'),
    fetch('/api/market-os/content-command-center/assets?family=Print & Offline Content'),
    fetch('/api/market-os/content-command-center/documents'),
  ])
}
