// Test-process preload only. Application HTTP dependencies stay on loopback.
const original=globalThis.fetch;
globalThis.fetch=function(input,options){const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return Promise.reject(Error('ISOLATED_LOCAL_RUNTIME_REFUSED_EXTERNAL_FETCH'));return original(input,options);};
