/** Host-owned observation only. Never fabricates package progress or saved state. */
export function runtimeHealthScript() {
  return `(function(){
 var channel=new URLSearchParams(location.hash.slice(1)).get('kfchannel');if(!channel)return;
 var problems=[];var send=function(action,data){parent.postMessage({contract:'kidflix.interactive.bridge.1',channel:channel,action:action,data:data},'*')};
 addEventListener('error',function(e){var node=e.target;if(node&&node!==window){problems.push(String(node.src||node.href||node.tagName));send('host.assetError',{source:problems[problems.length-1]})}else send('host.runtimeError',{message:String(e.message||'Script error').slice(0,300)})},true);
 addEventListener('unhandledrejection',function(e){send('host.runtimeError',{message:String(e.reason&&e.reason.message||e.reason||'Unhandled promise rejection').slice(0,300)})});
 var ready=function(){setTimeout(function(){var images=Array.from(document.images);images.forEach(function(img){if(img.complete&&!img.naturalWidth&&img.currentSrc)problems.push(img.currentSrc)});send('host.loaded',{assetsReady:problems.length===0,failed:problems.slice(0,12),title:document.title})},350)};
 if(document.readyState==='complete')ready();else addEventListener('load',ready,{once:true});
})();`;
}
