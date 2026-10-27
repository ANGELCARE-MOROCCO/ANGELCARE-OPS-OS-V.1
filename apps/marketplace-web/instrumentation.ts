/** JOBKIX R3: additively initializes an in-process scheduler, disabled in DB until activated. */
export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.NODE_ENV==='production'){
  const mod=await import('./angelcare-marketplace/jobkix/supply/r3/scheduler');
  mod.startJobkixSupplyScheduler();
 }
}
