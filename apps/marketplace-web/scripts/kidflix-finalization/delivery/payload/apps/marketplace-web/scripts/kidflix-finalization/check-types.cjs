// Marketplace-scoped gate. Includes all KidFlix routes/components and their transitive imports.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile);
if(config.error)throw Error(ts.flattenDiagnosticMessageText(config.error.messageText,'\n'));
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
const files=[];for(const folder of ['angelcare-marketplace/kidflix','app/kidflix','app/api/kidflix']){function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(/\.tsx?$/.test(entry.name))files.push(p);}}walk(path.join(root,folder));}
files.push(path.join(root,'next-env.d.ts'));
const program=ts.createProgram(files,{...parsed.options,incremental:false,noEmit:true});
const diagnostics=ts.getPreEmitDiagnostics(program);
const output=ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:f=>f,getNewLine:()=> '\n'});
process.stdout.write(output);console.log(JSON.stringify({gate:'Marketplace KidFlix with transitive dependencies',rootFiles:files.length,sourceFiles:program.getSourceFiles().length,errors:diagnostics.length}));
process.exitCode=diagnostics.length?1:0;
