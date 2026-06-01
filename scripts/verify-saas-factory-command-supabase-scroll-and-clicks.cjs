const fs=require('fs'),path=require('path');
const root=process.cwd();
const file='components/saas-factory/supabase/SaasFactorySupabaseCommandCenter.tsx';
const p=path.join(root,file);
const failures=[];
if(!fs.existsSync(p)) failures.push(`Missing ${file}`);
const s=fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
for(const token of ['scrollBox','maxHeight: \'62vh\'','stickyHead','Supabase Tables & Resources Overview','onDoubleClick','Resource Explorer','Policy Remediation Center','Evidence Detail','Module Impact','status','risk']){
  if(!s.includes(token)) failures.push(`Missing token: ${token}`);
}
if(failures.length){console.error('Supabase scroll/click verification failed:');failures.forEach(f=>console.error('- '+f));process.exit(1)}
console.log('Supabase scroll/click verification passed.')
