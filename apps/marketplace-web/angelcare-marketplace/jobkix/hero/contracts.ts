/** PM6 stable public-front placement registry. Does not create new public routes. */
export type HeroTransition='fade'|'slide'|'zoom'|'none';
export type HeroFocal={x:number;y:number};
export type HeroSlide={id:string;assetId:string;mobileAssetId:string|null;alt:string;desktopFocal:HeroFocal;mobileFocal:HeroFocal;durationMs:number|null};
export type HeroDocument={slides:HeroSlide[];intervalMs:number;transition:HeroTransition;transitionMs:number;autoplay:boolean};
export type HeroResolvedSlide=HeroSlide & {url:string;mobileUrl:string;width:number;height:number};
export type HeroGallery=Omit<HeroDocument,'slides'> & {slides:HeroResolvedSlide[]};
export const HERO_ROOT='/angelcare-marketplace/admin/jobkix/hero-studio';
export const HERO_GROUPS=[
 {name:'Homepage & Discovery',ids:['P00','P01']},
 {name:'Sectors & Professions',ids:['P03','P04','P05','P06']},
 {name:'Destinations & Careers Abroad',ids:['P08','P09','P10']},
 {name:'Employers',ids:['P11','P12']},
 {name:'Salaries, Reviews & Resources',ids:['P13','P14','P15','P16']},
 {name:'Career Journeys',ids:['P17','P18','P19']},
 {name:'Trust, Help & Corporate',ids:['P20','P21','P22','P23','P24','P25']},
] as const;
export const HERO_FRONTS:Readonly<Record<string,{title:string;path:string;dynamic?:boolean}>>={
 P00:{title:'Homepage',path:''},P01:{title:'Find Jobs',path:'jobs'},
 P03:{title:'All Employment Sectors',path:'sectors'},P04:{title:'Sector Detail World',path:'sectors/:slug',dynamic:true},
 P05:{title:'All Professions',path:'professions'},P06:{title:'Profession Detail World',path:'professions/:slug',dynamic:true},
 P08:{title:'Country Careers World',path:'countries/:country',dynamic:true},P09:{title:'City & Region Careers World',path:'countries/:country/:city',dynamic:true},
 P10:{title:'Careers Abroad',path:'abroad'},P11:{title:'Employer Directory',path:'employers'},
 P12:{title:'Employer Public Profile',path:'employers/:id',dynamic:true},P13:{title:'Salaries & Compensation',path:'salaries'},
 P14:{title:'Workplace Reviews',path:'reviews'},P15:{title:'Career Resources Library',path:'resources'},
 P16:{title:'Career Guide Detail',path:'resources/:slug',dynamic:true},P17:{title:'For Jobseekers',path:'for-jobseekers'},
 P18:{title:'For Employers',path:'for-employers'},P19:{title:'How JOBKIX Works',path:'how-it-works'},
 P20:{title:'Trust & Safety',path:'trust'},P21:{title:'Help Center',path:'help'},
 P22:{title:'Help Article',path:'help/:slug',dynamic:true},P23:{title:'Contact',path:'contact'},
 P24:{title:'About JOBKIX',path:'about'},P25:{title:'Report a Problem',path:'report'},
};
export const EXCLUDED_PUBLIC_FRONTS=['P02','P07','P26'] as const;
export const EMPTY_HERO:HeroDocument={slides:[],intervalMs:3000,transition:'fade',transitionMs:700,autoplay:true};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const entity=/^[a-z0-9][a-z0-9-]{0,119}$/;
export function validPlacement(value:string):boolean{
 if(typeof value!=='string'||value.length>200)return false;
 const [front,...parts]=value.split(':');if(!(front in HERO_FRONTS))return false;
 if(!parts.length)return true;
 if(!HERO_FRONTS[front].dynamic||parts.length!==1)return false;
 if(front==='P12')return uuid.test(parts[0]);
 if(front==='P08')return /^[a-z]{2}$/.test(parts[0]);
 if(front==='P09')return /^[a-z]{2}~[a-f0-9]{16}$/.test(parts[0]);
 return entity.test(parts[0]);
}
export function placementFromPublicUrl(input:string):string|null{
 try{
  const u=new URL(input,'https://jobkix.invalid'),path=u.pathname.replace(/^\/jobkix\/(en|fr|es|hi|tl|id|ar)(?=\/|$)/,'').replace(/^\/+|\/+$/g,''),x=path.split('/');
  if(!path)return 'P00';
  const exact:Record<string,string>={jobs:'P01',sectors:'P03',professions:'P05',abroad:'P10',employers:'P11',salaries:'P13',reviews:'P14',resources:'P15','for-jobseekers':'P17','for-employers':'P18','how-it-works':'P19',trust:'P20',help:'P21',contact:'P23',about:'P24',report:'P25'};
  if(x.length===1)return exact[x[0]]||null;
  if(x.length===2&&x[0]==='sectors')return validPlacement('P04:'+x[1])?'P04:'+x[1]:null;
  if(x.length===2&&x[0]==='professions')return validPlacement('P06:'+x[1])?'P06:'+x[1]:null;
  if(x.length===2&&x[0]==='countries')return validPlacement('P08:'+x[1])?'P08:'+x[1]:null;
  if(x.length===3&&x[0]==='countries')return validPlacement('P09:'+x[1]+'~'+x[2])?'P09:'+x[1]+'~'+x[2]:null;
  if(x.length===2&&x[0]==='employers')return validPlacement('P12:'+x[1])?'P12:'+x[1]:null;
  if(x.length===2&&x[0]==='resources')return validPlacement('P16:'+x[1])?'P16:'+x[1]:null;
  if(x.length===2&&x[0]==='help')return validPlacement('P22:'+x[1])?'P22:'+x[1]:null;
 }catch{/* Invalid public path: never select another page's hero. */}
 return null;
}
export function isUUID(v:string):boolean{return uuid.test(v)};
export function validateHero(input:unknown):HeroDocument{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid hero configuration');
 const v=input as Record<string,unknown>,allowed=['slides','intervalMs','transition','transitionMs','autoplay'];
 if(Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Unrecognized configuration field');
 if(!Array.isArray(v.slides)||v.slides.length>12)throw Error('A gallery supports 0–12 slides');
 const whole=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;
 if(!whole(v.intervalMs,2000,12000)||!whole(v.transitionMs,0,1500))throw Error('Invalid timing');
 if(!['fade','slide','zoom','none'].includes(String(v.transition))||typeof v.autoplay!=='boolean')throw Error('Invalid playback configuration');
 const focal=(p:unknown)=>{if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid crop');const o=p as Record<string,unknown>;if(Object.keys(o).some(k=>!['x','y'].includes(k))||!whole(o.x,0,100)||!whole(o.y,0,100))throw Error('Invalid crop');return {x:o.x as number,y:o.y as number};};
 const seen=new Set<string>();const slides:HeroSlide[]=v.slides.map((raw)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid slide');const s=raw as Record<string,unknown>;
  if(Object.keys(s).some(k=>!['id','assetId','mobileAssetId','alt','desktopFocal','mobileFocal','durationMs'].includes(k)))throw Error('Unrecognized slide field');
  if(typeof s.id!=='string'||!uuid.test(s.id)||seen.has(s.id))throw Error('Invalid or repeated slide identifier');seen.add(s.id);
  if(typeof s.assetId!=='string'||!uuid.test(s.assetId))throw Error('Invalid media identifier');
  if(s.mobileAssetId!==null&&s.mobileAssetId!==undefined&&(typeof s.mobileAssetId!=='string'||!uuid.test(s.mobileAssetId)))throw Error('Invalid mobile media identifier');
  if(typeof s.alt!=='string'||s.alt.length>500)throw Error('Invalid description');
  if(s.durationMs!==null&&s.durationMs!==undefined&&!whole(s.durationMs,2000,12000))throw Error('Invalid slide timing');
  return {id:s.id,assetId:s.assetId,mobileAssetId:(s.mobileAssetId as string|null)||null,alt:s.alt,desktopFocal:focal(s.desktopFocal),mobileFocal:focal(s.mobileFocal),durationMs:(s.durationMs as number|null)||null};
 });
 return {slides,intervalMs:v.intervalMs as number,transition:v.transition as HeroTransition,transitionMs:v.transitionMs as number,autoplay:v.autoplay as boolean};
}
