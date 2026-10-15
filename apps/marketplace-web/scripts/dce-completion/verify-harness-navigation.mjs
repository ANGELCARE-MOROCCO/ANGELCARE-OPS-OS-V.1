import assert from 'node:assert/strict'
import http from 'node:http'
import {Browser} from 'happy-dom'

// Isolated regression for the prior DCE Recover edits false negative.
// No Marketplace service, database, screenshot, build or production files used.
const server=http.createServer((_req,res)=>{
 res.writeHead(200,{'Content-Type':'text/html'})
 res.end('<!doctype html><html><body>Same-origin navigation</body></html>')
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const origin='http://127.0.0.1:'+server.address().port
const recoveryKey='angelcare.dce.draft.operator.record'
let sessionDrafts=[]
const browser=new Browser({settings:{navigation:{beforeContentCallback:w=>{
 for(const [key,value] of sessionDrafts)w.sessionStorage.setItem(key,value)
}}}})
const page=browser.newPage()
try{
 await page.goto(origin+'/start')
 const original=page.mainFrame.window.sessionStorage
 original.setItem(recoveryKey,JSON.stringify({version:2,record:{title:'Retained edit'},baseline:{revision:3}}))
 original.setItem('unrelated-private-key','DO_NOT_COPY')
 sessionDrafts=[]
 for(let i=0;i<original.length;i++){
  const key=original.key(i)
  if(key?.startsWith('angelcare.dce.draft.'))sessionDrafts.push([key,original.getItem(key)])
 }
 await page.goto(origin+'/reopen')
 const restored=page.mainFrame.window.sessionStorage
 assert.equal(JSON.parse(restored.getItem(recoveryKey)).record.title,'Retained edit')
 assert.equal(JSON.parse(restored.getItem(recoveryKey)).baseline.revision,3)
 assert.equal(restored.getItem('unrelated-private-key'),null)
 console.log('PASS DCE session recovery persists through isolated Happy DOM navigation')
 console.log('PASS Original recovery baseline preserved')
 console.log('PASS Non-DCE session keys not copied into the new Window')
} finally {
 await browser.close()
 await new Promise(resolve=>server.close(resolve))
}
