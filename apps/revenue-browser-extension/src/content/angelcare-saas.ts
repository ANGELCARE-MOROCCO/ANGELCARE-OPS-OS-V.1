window.postMessage({ type:'ANGELCARE_EXTENSION_PRESENT', extensionId:chrome.runtime.id, version:chrome.runtime.getManifest().version }, window.location.origin)
chrome.runtime.onMessage.addListener((message: any) => {
  if (message?.type === 'ANGELCARE_HIGHLIGHT_CONNECTED') document.documentElement.dataset.angelcareRevenueExtension = 'connected'
})
