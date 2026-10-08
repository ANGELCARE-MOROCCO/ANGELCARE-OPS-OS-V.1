import {createHash} from 'node:crypto'
export function sha256Node(input:string){return createHash('sha256').update(input.normalize('NFC').trim(),'utf8').digest('hex')}
