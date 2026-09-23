import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root=process.cwd()
const files={
  renderer:path.join(root,'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx'),
  design:path.join(root,'angelcare-marketplace/studio-universal/design.tsx'),
  css:path.join(root,'angelcare-marketplace/studio-universal/css-fidelity.ts'),
  shell:path.join(root,'angelcare-marketplace/studio-universal/components/StudioDesignShell.tsx'),
}
const read=p=>fs.readFileSync(p,'utf8')
const startsClient=s=>/^\s*['\"]use client['\"]\s*;?/m.test(s.split('\n').slice(0,4).join('\n'))

test('published renderer calls shared server-safe design/css utilities',()=>{
  const renderer=read(files.renderer)
  assert.match(renderer,/import \{ designToStyle, responsiveDataAttributes \} from '\.\/design'/)
  assert.match(renderer,/import \{ scopedImportedCss \} from '\.\/css-fidelity'/)
  assert.match(renderer,/scopedImportedCss\(id, props\.__studioImportedRules\)/)
  assert.match(renderer,/designToStyle\(props\.sourceDesign\)/)
})

test('shared utility modules are not client-boundary modules',()=>{
  assert.equal(startsClient(read(files.design)),false,'design.tsx must remain shared/server-callable')
  assert.equal(startsClient(read(files.css)),false,'css-fidelity.ts must remain shared/server-callable')
})

test('client design shell may consume the same shared utilities',()=>{
  const shell=read(files.shell)
  assert.match(shell,/['\"]use client['\"]/)
  assert.match(shell,/scopedImportedCss\(blockId, importedRules\)/)
  assert.match(shell,/responsiveStyleCss\(blockId,responsive\)/)
})

test('server-called utility modules transpile cleanly',()=>{
  for(const file of [files.design,files.css,files.renderer]){
    const source=read(file)
    const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},fileName:file,reportDiagnostics:true})
    const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error)
    assert.equal(errors.length,0,`${path.basename(file)} transpile errors: ${errors.map(d=>d.messageText).join(' | ')}`)
  }
})
