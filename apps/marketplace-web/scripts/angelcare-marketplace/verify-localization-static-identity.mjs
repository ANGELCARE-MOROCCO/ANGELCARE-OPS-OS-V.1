import assert from 'node:assert/strict'
import ts from 'typescript'
import { staticIdentityDescriptor } from '../../angelcare-marketplace/localization-intelligence/static-identity.ts'

function identityOf(source,target){
 const file=ts.createSourceFile('ProductCard.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
 let found=null
 function visit(node,owner='module'){
  let next=owner
  if(ts.isFunctionDeclaration(node)&&node.name)next=node.name.text
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name))next=node.name.text
  if((ts.isJsxText(node)||ts.isStringLiteralLike(node))&&node.getText(file).includes(target))found=staticIdentityDescriptor(node,file,'angelcare-marketplace/catalog/ProductCard.tsx',next,ts.isJsxText(node)?'jsx_text':'string').signature
  ts.forEachChild(node,child=>visit(child,next))
 }
 visit(file);assert.ok(found,`Target not found: ${target}`);return found
}
const base=`export function ProductCard(){return <article data-surface="product-card"><header><h2>Produit vedette</h2></header><button type="button">Ajouter au panier</button></article>}`
const lineInsertion=`\n\n${base}`
const unrelatedInsertion=`export function ProductCard(){return <article data-surface="product-card"><aside><p>Nouveau conseil</p></aside><header><h2>Produit vedette</h2></header><button type="button">Ajouter au panier</button></article>}`
const unrelatedSameKindInsertion=`export function ProductCard(){return <article data-surface="product-card"><button type="button" data-action="compare">Comparer</button><header><h2>Produit vedette</h2></header><button type="button">Ajouter au panier</button></article>}`
const formatted=`export function ProductCard ( ) {\n return (\n  <article data-surface = "product-card">\n   <header> <h2>Produit vedette</h2> </header>\n   <button type = "button">Ajouter au panier</button>\n  </article>\n )\n}`
const target='Ajouter au panier',expected=identityOf(base,target)
assert.equal(identityOf(lineInsertion,target),expected)
assert.equal(identityOf(unrelatedInsertion,target),expected)
assert.equal(identityOf(unrelatedSameKindInsertion,target),expected)
assert.equal(identityOf(formatted,target),expected)
console.log('STATIC_KEY_SURVIVES_LINE_INSERTION=YES')
console.log('STATIC_KEY_SURVIVES_UNRELATED_STRING_INSERTION=YES')
console.log('STATIC_KEY_SURVIVES_FORMATTING=YES')
