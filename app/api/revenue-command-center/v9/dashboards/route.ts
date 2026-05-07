import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ ok: true, dashboards: [{ key:'control', title:'Control Tower' }, { key:'tasks', title:'Task Execution' }, { key:'pipeline', title:'Prospect Pipeline' }, { key:'management', title:'Management' }] }) }
