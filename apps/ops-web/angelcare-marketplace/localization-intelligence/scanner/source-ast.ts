import ts from 'typescript'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { BRAND_LOCKS, PLACEHOLDER_PATTERN, USER_VISIBLE_PROP_NAMES } from '../constants'
import { sha256, stableSemanticKey } from '../hash'
import type { DiscoveredCandidate } from '../types'
const EXTENSIONS = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs'])
function meaningful(text:string){ const v=text.replace(/\s+/g,' ').trim(); return v.length>1 && /[A-Za-zÀ-ÿ\u0600-\u06ff]/.test(v) && !/^https?:\/\//.test(v) }
function domainFromPath(file:string){ const parts=file.split(path.sep); const i=parts.indexOf('angelcare-marketplace'); return i>=0 ? (parts[i+1]||'foundation') : 'ops-web' }
function classify(text:string){ if(BRAND_LOCKS.some((x)=>text===x)) return 'brand_locked' as const; if(/^\{\{/.test(text)) return 'variable_only' as const; return 'translatable' as const }
export async function scanSourceAst(filePath:string, appRoot:string): Promise<DiscoveredCandidate[]> {
  if(!EXTENSIONS.has(path.extname(filePath))) return []
  const source=await readFile(filePath,'utf8'); const kind=filePath.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS
  const sf=ts.createSourceFile(filePath,source,ts.ScriptTarget.Latest,true,kind); const out:DiscoveredCandidate[]=[]
  async function add(node:ts.Node,text:string,kindName:string,component?:string){ const clean=text.replace(/\s+/g,' ').trim(); if(!meaningful(clean)) return; const pos=sf.getLineAndCharacterOfPosition(node.getStart(sf)); const rel=path.relative(appRoot,filePath); const variables=[...(clean.match(PLACEHOLDER_PATTERN)||[])]; const stableKey=stableSemanticKey(['marketplace',domainFromPath(filePath),component,kindName,String(pos.line+1)]); out.push({stableKey,sourceTextFr:clean,sourceHash:await sha256(clean),sourceType:'source_ast',sourcePath:rel,sourceLine:pos.line+1,sourceColumn:pos.character+1,component,domain:domainFromPath(filePath),contentType:kindName,sensitivity:'ordinary',variables,supportsHtml:false,directionalityRisk:/[<>]|\b(dir|left|right)\b/i.test(clean),classification:classify(clean),confidence:.92,discoveryEvidence:{syntaxKind:ts.SyntaxKind[node.kind]}}) }
  const promises:Promise<void>[]=[]
  function visit(node:ts.Node,component?:string){
    let current=component; if(ts.isFunctionDeclaration(node)&&node.name) current=node.name.text; if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)) current=node.name.text
    if(ts.isJsxText(node)) promises.push(add(node,node.getText(sf),'jsx_text',current))
    if(ts.isStringLiteralLike(node)) {
      const parent=node.parent; let visible=false; let type='string'
      if(ts.isJsxAttribute(parent)){ const name=parent.name.getText(sf); visible=USER_VISIBLE_PROP_NAMES.has(name); type=`jsx_attribute_${name}` }
      if(ts.isPropertyAssignment(parent)){ const name=parent.name.getText(sf).replace(/["']/g,''); visible=USER_VISIBLE_PROP_NAMES.has(name); type=`object_property_${name}` }
      if(visible) promises.push(add(node,node.text,type,current))
    }
    ts.forEachChild(node,(c)=>visit(c,current))
  }
  visit(sf); await Promise.all(promises); return out
}
