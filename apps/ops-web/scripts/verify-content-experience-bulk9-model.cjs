#!/usr/bin/env node
const assert=require('assert')
function policy({immutable=false,total=0,active=0,archive=true,restore=true,status='draft'}){return{edit:!immutable,softDelete:!immutable&&archive,restore:restore&&['archived','retired','cancelled','paused','false'].includes(status),purge:!immutable&&total===0&&active===0,supersede:true}}
assert.equal(policy({}).purge,true)
assert.equal(policy({total:1}).purge,false)
assert.equal(policy({active:1}).purge,false)
assert.equal(policy({immutable:true}).edit,false)
assert.equal(policy({immutable:true}).purge,false)
assert.equal(policy({status:'archived'}).restore,true)
assert.equal(policy({status:'active'}).restore,false)
const confirmation=(expected,provided)=>expected===provided
assert.equal(confirmation('DOS-2026-001','DOS-2026-001'),true)
assert.equal(confirmation('DOS-2026-001','delete'),false)
console.log('PASS — deterministic dependency, immutability, restoration and typed-confirmation policy tests pass')
