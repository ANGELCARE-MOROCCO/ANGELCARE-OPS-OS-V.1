/** Deterministic geographic artwork from preserved public-domain numeric data. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const app=path.resolve(__dirname,'../..');
function worldMap(bytes){
 const source=JSON.parse(bytes.toString('utf8'));assert.equal(source.type,'FeatureCollection');assert.ok(Array.isArray(source.features)&&source.features.length<10000);
 const paths=[];let points=0;
 for(const feature of source.features){const geometry=feature.geometry;assert.ok(geometry&&['Polygon','MultiPolygon'].includes(geometry.type));const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  for(const polygon of polygons){let outline='';for(const ring of polygon){assert.ok(Array.isArray(ring)&&ring.length>=4);outline+=ring.map((point,index)=>{assert.ok(Array.isArray(point)&&point.length>=2);const [lon,lat]=point;assert.ok(Number.isFinite(lon)&&Number.isFinite(lat)&&lon>=-180&&lon<=180&&lat>=-90&&lat<=90);assert.ok(++points<1000000);return (index?'L':'M')+Number(((lon+180)*1000/360).toFixed(2))+','+Number(((90-lat)*500/180).toFixed(2));}).join('')+'Z';}paths.push('<path d="'+outline+'"/>');}
 }
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500" viewBox="0 0 1000 500"><metadata>Natural Earth 110m land, public domain. Equirectangular projection. No political boundaries or recruitment locations. Source SHA-256 '+hash+'. https://www.naturalearthdata.com/about/terms-of-use/</metadata><g fill="#bccce7" fill-rule="evenodd">'+paths.join('')+'</g></svg>\n');
}
module.exports={worldMap};
if(require.main===module){const source=fs.readFileSync(path.join(app,'docs/jobkix/geography-source/ne_110m_land.geojson')),target=path.join(app,'public/jobkix/geography/world-land.svg');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,worldMap(source));console.log('WORLD_MAP=deterministic preserved-source export; no geographic service or runtime dependency.');}
