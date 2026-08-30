import ts from 'typescript'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { BRAND_LOCKS, PLACEHOLDER_PATTERN, USER_VISIBLE_PROP_NAMES } from '../constants'
import { stableSemanticKey } from '../hash'
import {sha256Node} from './node-hash'
import type { DiscoveredCandidate } from '../types'
import { staticIdentityDescriptor } from '../static-identity'
const EXTENSIONS = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs'])
function meaningful(text:string){ const v=text.replace(/\s+/g,' ').trim(); return v.length>1 && /[A-Za-zÀ-ÿ\u0600-\u06ff]/.test(v) && !/^https?:\/\//.test(v) }
const HUMAN_OWNER=/(?:copy|label|title|heading|headline|subtitle|description|message|text|body|caption|placeholder|tooltip|help|empty|success|error|warning|cta|wording)$/i
function humanOwner(owner:string|undefined){return Boolean(owner&&HUMAN_OWNER.test(owner))}
function domainFromPath(file:string){ const parts=file.split(path.sep); const i=parts.indexOf('angelcare-marketplace'); return i>=0 ? (parts[i+1]||'foundation') : 'ops-web' }
function classify(text:string){ if(BRAND_LOCKS.some((x)=>text===x)) return 'brand_locked' as const; if(/^\{\{/.test(text)) return 'variable_only' as const; return 'translatable' as const }
function routeFromFile(relative:string){if(!relative.startsWith(`app${path.sep}angelcare-marketplace${path.sep}`))return undefined;const parts=relative.split(path.sep).slice(1).filter(part=>!/^\(.+\)$/.test(part)),last=parts.at(-1)||'';if(/^(page|layout|loading|error)\.[cm]?[jt]sx?$/.test(last))parts.pop();else parts[parts.length-1]=last.replace(/\.[cm]?[jt]sx?$/,'');return`/${parts.join('/')}`}
function audienceFromFile(relative:string){if(relative.includes(`${path.sep}admin${path.sep}`)||relative.includes(`${path.sep}(protected)${path.sep}`))return'admin';if(relative.includes(`${path.sep}account${path.sep}`)||relative.includes(`${path.sep}customer${path.sep}`))return'private';return relative.startsWith('app'+path.sep)?'public':'shared'}
function visibleContext(node:ts.Node,sf:ts.SourceFile){let current:ts.Node|undefined=node,depth=0;while(current&&!ts.isSourceFile(current)&&depth++<24){const parent:ts.Node|undefined=current.parent;if(!parent)break;if(ts.isJsxAttribute(parent)){const name=parent.name.getText(sf);return{visible:USER_VISIBLE_PROP_NAMES.has(name),type:`jsx_attribute_${name}`}}if(ts.isJsxExpression(parent))return{visible:true,type:'jsx_expression'};if(ts.isPropertyAssignment(parent)){const name=parent.name.getText(sf).replace(/["']/g,'');return{visible:USER_VISIBLE_PROP_NAMES.has(name),type:`object_property_${name}`}}if(ts.isCallExpression(parent)){const callee=parent.expression.getText(sf),index=parent.arguments.findIndex(argument=>argument===current||argument.pos<=node.pos&&argument.end>=node.end);if(/(?:MarketplaceError|toast|notify|setMessage|setError|apiFailure)$/i.test(callee)&&index>=0)return{visible:true,type:`user_message_${callee.replace(/[^\w.-]+/g,'_')}_${index}`}}if(ts.isStatement(parent)||ts.isVariableDeclaration(parent)||ts.isFunctionLike(parent))break;current=parent}return{visible:false,type:'string'}}
function templateSource(node:ts.TemplateExpression,sf:ts.SourceFile){let value=node.head.text;node.templateSpans.forEach((span,index)=>{const expression=span.expression.getText(sf).replace(/\s+/g,'').replace(/[^\w.-]/g,'_')||`value${index+1}`;value+=`{{${expression}}}${span.literal.text}`});return value}
export async function scanSourceAst(filePath:string, appRoot:string, audienceOverride?:string): Promise<DiscoveredCandidate[]> {
  if(!EXTENSIONS.has(path.extname(filePath))) return []
  const source=await readFile(filePath,'utf8'); const kind=filePath.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS
  const sf=ts.createSourceFile(filePath,source,ts.ScriptTarget.Latest,true,kind); const out:DiscoveredCandidate[]=[]
  const semanticOccurrences=new Map<string,number>()
  function add(node:ts.Node,text:string,kindName:string,component?:string){ const clean=text.replace(/\s+/g,' ').trim(); if(!meaningful(clean)) return; const pos=sf.getLineAndCharacterOfPosition(node.getStart(sf)); const rel=path.relative(appRoot,filePath); const variables=[...(clean.match(PLACEHOLDER_PATTERN)||[])]; const identity=staticIdentityDescriptor(node,sf,rel,component||'module',kindName);const occurrence=(semanticOccurrences.get(identity.signature)||0)+1;semanticOccurrences.set(identity.signature,occurrence);const stableKey=identity.explicitKey||stableSemanticKey(occurrence===1?identity.parts:[...identity.parts,'collision',String(occurrence)]); out.push({stableKey,sourceTextFr:clean,sourceHash:sha256Node(clean),sourceType:'source_ast',sourcePath:rel,sourceLine:pos.line+1,sourceColumn:pos.character+1,route:routeFromFile(rel),component,domain:domainFromPath(filePath),audience:audienceOverride||audienceFromFile(rel),contentType:kindName,sensitivity:'ordinary',variables,supportsHtml:false,directionalityRisk:/[<>]|\b(dir|left|right)\b/i.test(clean),classification:classify(clean),confidence:.96,discoveryEvidence:{syntaxKind:ts.SyntaxKind[node.kind],identity:'file_owner_structural_ast',semanticSignature:identity.signature,collisionOrdinal:occurrence,explicitKey:identity.explicitKey,audienceAuthority:audienceOverride?'app_router_import_graph':'source_location'}}) }
  function visit(node:ts.Node,component?:string){
    let current=component; if(ts.isFunctionDeclaration(node)&&node.name) current=node.name.text; if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)) current=node.name.text
    if(ts.isJsxText(node)) add(node,node.getText(sf),'jsx_text',current)
    if(ts.isStringLiteralLike(node)){const context=visibleContext(node,sf);if(context.visible||humanOwner(current))add(node,node.text,context.visible?context.type:'semantic_owner_text',current)}
    if(ts.isTemplateExpression(node)){const context=visibleContext(node,sf);if(context.visible||humanOwner(current))add(node,templateSource(node,sf),`template_${context.visible?context.type:'semantic_owner_text'}`,current)}
    ts.forEachChild(node,(c)=>visit(c,current))
  }
  visit(sf);return out
}
