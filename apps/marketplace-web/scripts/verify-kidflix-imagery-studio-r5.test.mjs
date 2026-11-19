import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (p) => readFileSync(new URL("../../angelcare-marketplace/" + p, import.meta.url), "utf8");
const kid = read("kidflix/imagery/Studio.tsx");
const modern = read("marketplace-imagery/Studio.tsx");
const kidCss = read("kidflix/imagery/studio.module.css");
const modernCss = read("marketplace-imagery/studio.module.css");
const workspace = read("digital-customer-experience/components/Workspace.tsx");

test("KidFlix imagery editor transpiles without JSX / TypeScript syntax defects", () => {
  const res=ts.transpileModule(kid,{fileName:"kidflix/imagery/Studio.tsx",reportDiagnostics:true,
    compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  const errors=(res.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
  assert.deepEqual(errors.map(x=>ts.flattenDiagnosticMessageText(x.messageText,"\n")),[]);
  assert.ok(res.outputText.includes("KidFlix Imagery Studio"));
});

test("The modern AngelCare editor styling is copied losslessly and scoped to KidFlix Studio", () => {
  const anchor="/* ANGELCARE IMAGERY STUDIO PRO MAX BODY R2";
  const start=modernCss.indexOf(anchor);
  assert.ok(start>0,"Modern AngelCare body style missing");
  const exact=modernCss.slice(start).replaceAll("ANGELCARE IMAGERY STUDIO","KIDFLIX IMAGERY STUDIO");
  assert.ok(kidCss.endsWith(exact),"KidFlix must carry the identical modern Studio body and responsive design rules");
  for(const cls of [".titleLead",".headerActions",".editor",".sequenceGrid",".inspector",".editorDetails",".previewAddress",".mapHeading",".canvasHeading",".sequenceTile",".focalInline"]){
    assert.ok(kidCss.includes(cls),cls);
    assert.ok(kid.includes("s."+cls.slice(1)), "Modern visual component not wired: "+cls);
  }
  assert.ok(!kidCss.includes("body >")&&!kidCss.includes("html >"),"Do not globally override admin shell");
});

test("KidFlix retains a distinct admin studio with its own draft/publish authority and original artwork registry", () => {
  assert.ok(workspace.includes('import("../../kidflix/imagery/Studio")'));
  assert.ok(workspace.includes('module === "kidflix-imagery"'));
  assert.ok(workspace.includes('module === "angelcare-imagery"'));
  for(const original of ["kidflix_imagery_save","kidflix_imagery_publish","kidflix_imagery_restore","kidflix_imagery","kidflix.imagery.draft.v1.","kidflix.imagery.badge-favourites","kidflix-imagery-preview","kidflix-imagery-ready","kidflix-imagery-owned","kidflix-imagery-select","kidflix-imagery-slots"]){
    assert.ok(kid.includes(original),"KidFlix native authority was lost: "+original);
  }
  for(const illegal of ["angelcare_imagery_save","angelcare_imagery_publish","angelcare.imagery.draft.v1.","LiveDeliveryInspector","pagePath("]){
    assert.ok(!kid.includes(illegal),"An AngelCare-only authority leaked into KidFlix: "+illegal);
  }
  for(const original of ["home-reference/HomeShell","documents/DocumentShell","storefront-reference/CategoryShell","pageSlots(page)","WORLDS","NativeImagePicker","imageReferenceIssue","CopyPageImagery","BatchTools"]){
    assert.ok(kid.includes(original),"Native KidFlix asset/layout authority missing: "+original);
  }
});

test("AngelCare visual parity includes 12-place sequence controls, responsive preview and status actions",()=>{
  for(const term of ['aria-label="Images in the selected placement"','Upload image into empty position','Move image ','Replace image ','Remove image ','Set desktop focal point','Set mobile image','Slideshow-ready','Workspace page preview','KidFlix Imagery Studio','KidFlix preview language','Preview connected','image.mobile','source dossier','Save draft']){
    assert.ok(kid.includes(term),"Required parity capability missing: "+term);
  }
  for(const cap of ["Math.max(1, 12 - images.length)","const sequential =","if (item.replaceFor)","uploadReplace(files: FileList | null","!item.replaceFor","multiple={!!descriptor?.sequence}"]){
    assert.ok(kid.includes(cap),"Sequence/media safety missing: "+cap);
  }
  assert.ok(kid.includes("path(\n        previewLocale,"));
  assert.ok(kid.includes('value={previewLocale}'));
  assert.ok(kid.includes("summary?.publishedAt"));
  assert.ok(kid.includes("const usage")===false,"Do not fabricate asset usage summaries");
});

test("KidFlix keeps its extra resource-usage inspector absent from AngelCare and no public runtime is modified",()=>{
  assert.ok(kid.includes("Where this image is assigned"));
  assert.ok(kid.includes("Resource-owned cover selected."));
  assert.ok(kid.includes("kidflix-imagery"));
  assert.ok(!modern.includes("Where this image is assigned"));
});
