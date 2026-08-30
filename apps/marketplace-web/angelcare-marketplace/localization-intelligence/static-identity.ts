import ts from 'typescript'

const STRUCTURAL_ATTRIBUTES=new Set(['id','name','role','type','href','htmlFor','data-testid','data-surface','data-slot','data-role','data-action','data-field','data-section'])
const TRANSLATION_KEY_ATTRIBUTES=new Set(['data-localization-key','data-i18n-key','translationKey'])

function propertyName(node:ts.PropertyName|undefined){
 if(!node)return''
 if(ts.isIdentifier(node)||ts.isStringLiteralLike(node)||ts.isNumericLiteral(node))return node.text
 return node.getText()
}
function jsxTag(node:ts.JsxOpeningLikeElement){return node.tagName.getText()}
function literalAttribute(node:ts.JsxOpeningLikeElement,name:string){
 const attribute=node.attributes.properties.find(item=>ts.isJsxAttribute(item)&&item.name.getText()===name)
 if(!attribute||!ts.isJsxAttribute(attribute)||!attribute.initializer)return''
 if(ts.isStringLiteral(attribute.initializer))return attribute.initializer.text
 if(ts.isJsxExpression(attribute.initializer)&&attribute.initializer.expression&&ts.isStringLiteralLike(attribute.initializer.expression))return attribute.initializer.expression.text
 return''
}
function openingElement(node:ts.Node):ts.JsxOpeningLikeElement|null{
 if(ts.isJsxElement(node))return node.openingElement
 if(ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node))return node
 return null
}
function explicitTranslationKey(node:ts.Node){let current:ts.Node|undefined=node,depth=0;while(current&&!ts.isSourceFile(current)&&depth++<96){const opening=openingElement(current);if(opening){for(const name of TRANSLATION_KEY_ATTRIBUTES){const value=literalAttribute(opening,name);if(value)return value}}current=current.parent}return null}
function structuralJsxPart(opening:ts.JsxOpeningLikeElement){const attributes:string[]=[];for(const name of STRUCTURAL_ATTRIBUTES){const value=literalAttribute(opening,name);if(value)attributes.push(`${name}=${value}`)}return`jsx:${jsxTag(opening)}${attributes.length?`[${attributes.sort().join('|')}]`:''}`}

function declarationIdentity(node:ts.Node,sourceFile:ts.SourceFile){
 if(ts.isVariableDeclaration(node))return`variable:${node.name.getText(sourceFile)}`
 if(ts.isFunctionDeclaration(node)||ts.isFunctionExpression(node)||ts.isMethodDeclaration(node))return`function:${node.name?.getText(sourceFile)||'anonymous'}`
 if(ts.isArrowFunction(node)){const parent=node.parent;return ts.isVariableDeclaration(parent)?`function:${parent.name.getText(sourceFile)}`:'function:anonymous'}
 return''
}

export function staticIdentityDescriptor(node:ts.Node,sourceFile:ts.SourceFile,relativeFile:string,owner:string,kindName:string){
 const explicitKey=explicitTranslationKey(node)
 if(explicitKey)return{explicitKey,signature:`explicit:${explicitKey}`,parts:['marketplace','explicit',explicitKey]}
 const ancestry:string[]=[];let current:ts.Node|undefined=node,depth=0
 while(current&&!ts.isSourceFile(current)&&depth++<96){
  if(ts.isJsxAttribute(current))ancestry.push(`attribute:${current.name.getText()}`)
  else{const opening=openingElement(current);if(opening)ancestry.push(structuralJsxPart(opening))
  else if(ts.isPropertyAssignment(current)||ts.isPropertySignature(current)||ts.isMethodDeclaration(current))ancestry.push(`property:${propertyName(current.name)}`)
  else if(declarationIdentity(current,sourceFile))ancestry.push(declarationIdentity(current,sourceFile))
  else if(ts.isCallExpression(current)){const expression=current.expression.getText(sourceFile);const argumentIndex=current.arguments.findIndex(argument=>argument===node||argument.pos<=node.pos&&argument.end>=node.end);ancestry.push(`call:${expression}:argument:${Math.max(0,argumentIndex)}`)}
  else if(ts.isReturnStatement(current))ancestry.push('return')
  else if(ts.isConditionalExpression(current))ancestry.push(current.whenTrue.pos<=node.pos&&current.whenTrue.end>=node.end?'conditional:true':'conditional:false')}
  current=current.parent
 }
 const parts=['marketplace','static',relativeFile,owner||'module',kindName,...ancestry.reverse()]
 return{explicitKey:null,signature:parts.join('::'),parts}
}
