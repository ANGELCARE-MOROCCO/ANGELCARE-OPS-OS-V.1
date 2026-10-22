const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
function sourceFingerprint(){const files=[];
 function walk(relative){for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){const name=path.join(relative,entry.name);if(entry.isSymbolicLink())throw Error('Verification source symlink refused');if(entry.isDirectory())walk(name);else files.push(name);}}
 for(const scope of ['angelcare-marketplace/jobkix','app/jobkix','app/api/jobkix','app/angelcare-marketplace/(protected)/admin/jobkix','public/jobkix','scripts/jobkix'])walk(scope);
 for(const entry of JSON.parse(fs.readFileSync(path.join(root,'docs/jobkix/shared-file-register.json'))))files.push(entry.path.replace(/^apps\/marketplace-web\//,''));
 const digest=crypto.createHash('sha256');for(const relative of files.sort()){digest.update(relative+'\0');digest.update(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest());}
 return {algorithm:'sha256',scope:'runtime-and-verification-source-v2',files:files.length,digest:digest.digest('hex')};
}
/** Keep live captures outside application scanning/watch paths. Publish the
 * finished evidence only after the development runtime has been stopped. */
function evidenceDirectory(){const directory='/private/tmp/jobkix-source-20261020/browser-evidence';fs.mkdirSync(directory,{recursive:true});return directory;}
module.exports={sourceFingerprint,evidenceDirectory};
