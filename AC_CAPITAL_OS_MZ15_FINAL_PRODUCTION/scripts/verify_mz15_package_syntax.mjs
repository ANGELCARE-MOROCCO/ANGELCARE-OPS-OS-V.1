import path from "node:path";
import fs from "node:fs";
import { assert, detectRoots, loadTypeScript, walk } from "./_lib.mjs";
const ts=loadTypeScript();const { opsRoot }=detectRoots();const roots=[path.join(opsRoot,"components","ac-capital-os"),path.join(opsRoot,"lib","ac-capital-os"),path.join(opsRoot,"app","api","ac-capital-os"),path.join(opsRoot,"app","(protected)","ac-capital-os")];const files=roots.flatMap(root=>walk(root,f=>/\.tsx?$/.test(f)));const errors=[];
for(const file of files){const out=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,isolatedModules:true},fileName:file,reportDiagnostics:true});for(const diagnostic of out.diagnostics||[]){if(diagnostic.category===ts.DiagnosticCategory.Error)errors.push(`${file} TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText," ")}`)}}
assert(!errors.length,errors.join("\n"));console.log(`MZ15_PACKAGE_SYNTAX_VERIFIED (${files.length} TypeScript files)`);
