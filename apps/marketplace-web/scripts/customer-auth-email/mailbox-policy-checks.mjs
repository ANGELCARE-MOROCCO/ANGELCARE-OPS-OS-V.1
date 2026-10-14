import assert from 'node:assert/strict'
import {authOperationsMailbox,selectSanilaOperationsMailbox} from '../../lib/email-os-core/operational-mailboxes.ts'
const origin='https://my.angelcarehub.com'
assert.equal(authOperationsMailbox(new URL('/angelcare-marketplace/auth/callback',origin),origin),'supports@angelcarehub.ma')
assert.equal(authOperationsMailbox(new URL('/sanila/auth/callback',origin),origin),'it.support@angelcarehub.ma')
assert.equal(authOperationsMailbox(new URL('/sanilax',origin),origin),'supports@angelcarehub.ma')
assert.equal(selectSanilaOperationsMailbox([{email:'b2b@angelcarehub.ma'},{email:'supports@angelcarehub.ma'}]),undefined)
assert.equal(selectSanilaOperationsMailbox([{email:'b2b@angelcarehub.ma'},{email:' IT.SUPPORT@angelcarehub.ma '}]).email,' IT.SUPPORT@angelcarehub.ma ')
console.log('MAILBOX_POLICY=5/5 PASS; unavailable IT mailbox never selects another sender')
