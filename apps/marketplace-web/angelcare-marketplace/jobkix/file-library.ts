/** Only fields consumed by the owned document library may enter its client props. */
export function fileLibraryRows(rows:Record<string,unknown>[]){return rows.map(row=>Object.fromEntries(['id','filename','mime','purpose','organization_id','state','expected_bytes','revision','library_archived_at','upload_key'].map(key=>[key,row[key]])));}
