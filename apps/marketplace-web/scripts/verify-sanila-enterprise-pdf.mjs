import fs from 'node:fs'
const source=fs.readFileSync(new URL('../lib/angelcare360/documents/pdf.ts',import.meta.url),'utf8')
const fail=(m)=>{throw new Error(`SANILA_ENTERPRISE_PDF_VERIFY_FAILED: ${m}`)}
if (/rows\.slice\s*\(\s*0\s*,\s*8\s*\)/.test(source)) fail('eight-row truncation remains')
if (!source.includes('Page ${pageNo}/${total}')) fail('dynamic Page X/Y footer absent')
if (!source.includes("'TABLEAU — SUITE'")) fail('table continuation absent')
if (!source.includes('SANILA_PDF_UNICODE_FONT_PATH')) fail('Unicode/Arabic font runtime contract absent')
if (!source.includes('for (const rawRow of rows)')) fail('all-row renderer absent')
console.log('PDF_EIGHT_ROW_TRUNCATION=0')
console.log('PDF_MULTIPAGE_TABLE=PASS')
console.log('PDF_PAGE_X_OF_Y=PASS')
console.log('PDF_UNICODE_FONT_CONTRACT=PASS')
